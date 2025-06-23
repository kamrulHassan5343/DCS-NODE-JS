const { pool } = require('../config/config');
const logger = require('../utils/logger');
const crypto = require('crypto');

// Entry point: POST /api/admission_store
exports.admissionStore = async (req, res) => {
    try {
        logger.info('Raw request body:', JSON.stringify(req.body));

        let jsonData;
        if (typeof req.body.json === 'string') {
            try {
                jsonData = JSON.parse(req.body.json);
            } catch (parseError) {
                logger.error('Failed to parse JSON:', parseError);
                return res.status(400).json({ status: 'E', message: 'Invalid JSON format in request' });
            }
        } else if (typeof req.body.json === 'object') {
            jsonData = req.body.json;
        } else {
            return res.status(400).json({ status: 'E', message: 'Invalid JSON data in request' });
        }

        const result = await processAdmissionData(req, jsonData);
        return res.json(result);

    } catch (error) {
        logger.error('Admission store error:', error.message, error.stack);
        return res.status(500).json({ status: 'E', message: error.message });
    }
};


async function processAdmissionData(req, jsonData) {
    const token = req.body.token;

    const flag = jsonData.flag;
    const data = jsonData.data[0];
    const dynamicfieldvalue = jsonData.extra || null;

    const projectcode = String(data.projectcode || '').padStart(3, '0');
    const branchcode = String(data.branchcode || '').padStart(4, '0');
    const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

    if (token !== '7f30f4491cb4435984616d1913e88389') {
        return { status: 'E', message: "Token Invalid" };
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const admissionData = extractAdmissionData(data);
        admissionData.projectcode = projectcode;
        admissionData.branchcode = branchcode;
        admissionData.DynamicFieldValue = dynamicfieldvalue;
        admissionData.updated_at = currentTime;
        admissionData.created_at = currentTime;

        const doc_id = await saveAdmissionData(client, admissionData);

        await client.query('COMMIT');
        logger.info('Transaction committed. Doc ID:', doc_id);

        return {
            status: "S",
            message: flag === 2 ? "Profile update request submitted successfully" : "Admission request submitted successfully"
        };

    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('Transaction rolled back:', error.message);
        throw error;
    } finally {
        client.release();
    }
}


async function checkPointAdmission(db, orgno, pin, erp_mem_id, branchcode, projectcode, enroll_id, flag) {
    if (flag !== '2') return 'success';

    try {
        const result = await pool.query(
            `SELECT created_at::date as created_at, roleid, reciverrole, status 
             FROM ${db}.admissions 
             WHERE branchcode = $1 AND orgno = $2 AND projectcode = $3 
             AND assignedpo = $4 AND erp_member_id = $5 AND entollmentid != $6 
             AND (status NOT IN ('2','3') OR erpstatus NOT IN ('2','3'))`,
            [branchcode, orgno, projectcode, pin, erp_mem_id, enroll_id]
        );

        if (result.rows.length === 0) return 'success';

        const row = result.rows[0];
        let designation = '';
        
        if (row.roleid === 0 && row.reciverrole === 1) {
            designation = row.status === '1' ? 
                (await isAbm(branchcode, pin) ? 'এবিএম' : 'বিএম') : 
                'ইআরপি';
        } else if (row.roleid === 1 && row.reciverrole === 1) {
            designation = 'ইআরপি';
        } else {
            designation = 'পিও';
        }

        designation = { 2: 'এ এম', 3: 'আর এম' }[row.reciverrole] || designation;

        return JSON.stringify({
            status: "DEL",
            message: `দুঃখিত! এই সদস্যের প্রোফাইল আপডেট ${row.created_at} তারিখে ${designation} এর কাছে পেন্ডিং আছে ।\n•অনুগ্রহ করে পূর্বের প্রোফাইল আপডেট রিকুয়েস্ট সুপারভাইজার/ERP-এর মাধ্যমে অনুমোদন/রিজেক্ট/সেন্ডব্যাক করতে হবে।`
        });
    } catch (error) {
        logger.error('Error in checkPointAdmission:', error.message);
        throw error;
    }
}

async function handleBiometricData(client, db, biometricInfo, branchcode, projectcode, admissionData) {
    if (!biometricInfo || biometricInfo === null) return;

    try {
        const exists = await client.query(
            `SELECT 1 FROM ${db}.biometric_info 
             WHERE branchcode = $1 AND projectcode = $2 AND orgno = $3 
             AND assign_po_pin = $4 AND enrollment_id = $5`,
            [branchcode, projectcode, admissionData.orgno, admissionData.assignedpo, admissionData.entollmentid]
        );

        if (exists.rows.length === 0) {
            await client.query(
                `INSERT INTO ${db}.biometric_info 
                 (branchcode, projectcode, orgno, assign_po_pin, enrollment_id, biometric_info) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [branchcode, projectcode, admissionData.orgno, admissionData.assignedpo, 
                 admissionData.entollmentid, JSON.stringify(biometricInfo)]
            );
        } else {
            await client.query(
                `UPDATE ${db}.biometric_info 
                 SET biometric_info = $1 
                 WHERE branchcode = $2 AND projectcode = $3 AND orgno = $4 
                 AND assign_po_pin = $5 AND enrollment_id = $6`,
                [JSON.stringify(biometricInfo), branchcode, projectcode, 
                 admissionData.orgno, admissionData.assignedpo, admissionData.entollmentid]
            );
        }
    } catch (error) {
        logger.error('Error in handleBiometricData:', error.message);
        throw error;
    }
}

// Helper function for ABM check - you'll need to implement this based on your business logic
async function isAbm(branchcode, pin) {
    try {
        // Add your ABM checking logic here
        // This is a placeholder - replace with actual implementation
        const result = await pool.query(
            `SELECT 1 FROM your_abm_table WHERE branchcode = $1 AND pin = $2`,
            [branchcode, pin]
        );
        return result.rows.length > 0;
    } catch (error) {
        logger.error('Error checking ABM status:', error.message);
        return false;
    }
}

async function saveAdmissionData(client, data) {
    logger.info('Preparing to save admission data:', data);

    const existing = await client.query(
        `SELECT "id" FROM "dcs"."admissions" WHERE "branchcode" = $1 AND "assignedpo" = $2 AND "orgno" = $3 AND "entollmentid" = $4`,
        [data.branchcode, data.assignedpo, data.orgno, data.entollmentid]
    );

    if (existing.rows.length > 0) {
        logger.info('Updating existing admission record:', existing.rows[0].id);

        const updateQuery = `
            UPDATE "dcs"."admissions" SET 
                "IsRefferal" = $1, "RefferedById" = $2, "MemberId" = $3, "MemberCateogryId" = $4,
                "ApplicantsName" = $5, "MainIdTypeId" = $6, "IdNo" = $7, "DOB" = $8,
                "MotherName" = $9, "FatherName" = $10, "Phone" = $11, "PresentAddress" = $12,
                "PermanentAddress" = $13, "MaritalStatusId" = $14, "Occupation" = $15, "NomineeName" = $16,
                "GenderId" = $17, "SavingsProductId" = $18, "branchcode" = $19, "projectcode" = $20,
                "DynamicFieldValue" = $21, "updated_at" = $22
             WHERE "id" = $23`;

        const updateValues = [
            data.IsRefferal, data.RefferedById, data.MemberId, data.MemberCateogryId,
            data.ApplicantsName, data.MainIdTypeId, data.IdNo, data.DOB,
            data.MotherName, data.FatherName, data.Phone, data.PresentAddress,
            data.PermanentAddress, data.MaritalStatusId, data.Occupation, data.NomineeName,
            data.GenderId, data.SavingsProductId, data.branchcode, data.projectcode,
            data.DynamicFieldValue, data.updated_at,
            existing.rows[0].id
        ];

        await client.query(updateQuery, updateValues);
        return existing.rows[0].id;
    } else {
        logger.info('Inserting new admission record...');

        const insertQuery = `
            INSERT INTO "dcs"."admissions" (
                "IsRefferal", "RefferedById", "MemberId", "MemberCateogryId",
                "ApplicantsName", "MainIdTypeId", "IdNo", "DOB",
                "MotherName", "FatherName", "Phone", "PresentAddress",
                "PermanentAddress", "MaritalStatusId", "Occupation", "NomineeName",
                "GenderId", "SavingsProductId", "branchcode", "projectcode",
                "DynamicFieldValue", "created_at", "updated_at", "entollmentid", "orgno", "assignedpo",
                "status", "action", "reciverrole", "roleid", "Flag"
            ) VALUES (
                $1, $2, $3, $4,
                $5, $6, $7, $8,
                $9, $10, $11, $12,
                $13, $14, $15, $16,
                $17, $18, $19, $20,
                $21, $22, $23, $24, $25, $26,
                'PENDING', 'CREATE', 1, 1, $27
            ) RETURNING "id"`;

        const insertValues = [
            data.IsRefferal, data.RefferedById, data.MemberId, data.MemberCateogryId,
            data.ApplicantsName, data.MainIdTypeId, data.IdNo, data.DOB,
            data.MotherName, data.FatherName, data.Phone, data.PresentAddress,
            data.PermanentAddress, data.MaritalStatusId, data.Occupation, data.NomineeName,
            data.GenderId, data.SavingsProductId, data.branchcode, data.projectcode,
            data.DynamicFieldValue, data.created_at, data.updated_at, data.entollmentid,
            data.orgno, data.assignedpo,
            data.Flag || 1
        ];

        const result = await client.query(insertQuery, insertValues);
        logger.info('Insert successful. Inserted ID:', result.rows[0].id);
        return result.rows[0].id;
    }
}


function extractAdmissionData(data) {
    let entollmentid = data.entollmentid;
    if (!entollmentid || !isValidUUID(entollmentid)) {
        entollmentid = crypto.randomUUID();
    }

    return {
        IsRefferal: data.IsRefferal || false,
        RefferedById: data.RefferedById || null,
        MemberId: data.MemberId || null,
        MemberCateogryId: data.MemberCateogryId || null,
        ApplicantsName: data.ApplicantsName || null,
        MainIdTypeId: data.MainIdTypeId || null,
        IdNo: data.IdNo || null,
        DOB: data.DOB || null,
        MotherName: data.MotherName || null,
        FatherName: data.FatherName || null,
        Phone: data.Phone || null,
        PresentAddress: data.PresentAddress || null,
        PermanentAddress: data.PermanentAddress || null,
        MaritalStatusId: data.MaritalStatusId || null,
        Occupation: data.Occupation || null,
        NomineeName: data.NomineeName || null,
        GenderId: data.GenderId || null,
        SavingsProductId: data.SavingsProductId || null,
        branchcode: data.branchcode || null,
        projectcode: data.projectcode || null,
        entollmentid: entollmentid,
        orgno: data.orgno || data.vo_code || null,
        assignedpo: data.assignedpo || data.pin || null,
        Flag: data.Flag || 1
    };
}

function isValidUUID(str) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
}


function isValidUUID(str) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
}

module.exports = {
    admissionStore: exports.admissionStore
};