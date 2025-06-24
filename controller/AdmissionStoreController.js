const { pool } = require('../config/config');
const logger = require('../utils/logger');
const crypto = require('crypto');

const VALID_TOKEN = '7f30f4491cb4435984616d1913e88389';

// Main entry point: POST /api/admission_store
exports.admissionStore = async (req, res) => {
    try {
        const jsonData = parseRequestData(req.body);
        if (!jsonData.success) {
            return res.status(400).json({ status: 'E', message: jsonData.message });
        }

        const result = await processAdmissionData(req.body.token, jsonData.data);
        return res.json(result);

    } catch (error) {
        logger.error('Admission store error:', error.message);
        return res.status(500).json({ status: 'E', message: error.message });
    }
};

// Parse and validate request data
function parseRequestData(body) {
    try {
        let jsonData;
        if (typeof body.json === 'string') {
            jsonData = JSON.parse(body.json);
        } else if (typeof body.json === 'object') {
            jsonData = body.json;
        } else {
            return { success: false, message: 'Invalid JSON data in request' };
        }
        return { success: true, data: jsonData };
    } catch (error) {
        return { success: false, message: 'Invalid JSON format in request' };
    }
}

// Process admission data
async function processAdmissionData(token, jsonData) {
    // Validate token
    if (token !== VALID_TOKEN) {
        return { status: 'E', message: "Token Invalid" };
    }

    const { flag, data: rawData, extra: dynamicFieldValue } = jsonData;
    const data = rawData[0];

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const admissionData = buildAdmissionData(data, dynamicFieldValue);
        const docId = await saveAdmissionData(client, admissionData);

        await client.query('COMMIT');
        logger.info('Transaction committed. Doc ID:', docId);

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

// Build admission data object
function buildAdmissionData(data, dynamicFieldValue) {
    const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const entollmentid = isValidUUID(data.entollmentid) ? data.entollmentid : crypto.randomUUID();

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
        branchcode: String(data.branchcode || '').padStart(4, '0'),
        projectcode: String(data.projectcode || '').padStart(3, '0'),
        entollmentid: entollmentid,
        orgno: data.orgno || data.vo_code || null,
        assignedpo: data.assignedpo || data.pin || null,
        Flag: data.Flag || 1,
        DynamicFieldValue: dynamicFieldValue && dynamicFieldValue !== "" ? dynamicFieldValue : null,
        created_at: currentTime,
        updated_at: currentTime
    };
}

// Save admission data to database
async function saveAdmissionData(client, data) {
    // Ensure DynamicFieldValue is properly formatted for JSON column
    const dynamicFieldValue = data.DynamicFieldValue && data.DynamicFieldValue !== "" 
        ? (typeof data.DynamicFieldValue === 'string' ? data.DynamicFieldValue : JSON.stringify(data.DynamicFieldValue))
        : null;

    // Check if record exists
    const existing = await client.query(
        `SELECT id FROM dcs.admissions 
         WHERE branchcode = $1 AND assignedpo = $2 AND orgno = $3 AND entollmentid = $4`,
        [data.branchcode, data.assignedpo, data.orgno, data.entollmentid]
    );

    if (existing.rows.length > 0) {
        // Update existing record
        await client.query(`
            UPDATE dcs.admissions SET 
                "IsRefferal" = $1, "RefferedById" = $2, "MemberId" = $3, "MemberCateogryId" = $4,
                "ApplicantsName" = $5, "MainIdTypeId" = $6, "IdNo" = $7, "DOB" = $8,
                "MotherName" = $9, "FatherName" = $10, "Phone" = $11, "PresentAddress" = $12,
                "PermanentAddress" = $13, "MaritalStatusId" = $14, "Occupation" = $15, "NomineeName" = $16,
                "GenderId" = $17, "SavingsProductId" = $18, "DynamicFieldValue" = $19, "updated_at" = $20
            WHERE id = $21`,
            [data.IsRefferal, data.RefferedById, data.MemberId, data.MemberCateogryId,
             data.ApplicantsName, data.MainIdTypeId, data.IdNo, data.DOB,
             data.MotherName, data.FatherName, data.Phone, data.PresentAddress,
             data.PermanentAddress, data.MaritalStatusId, data.Occupation, data.NomineeName,
             data.GenderId, data.SavingsProductId, dynamicFieldValue, data.updated_at,
             existing.rows[0].id]
        );
        return existing.rows[0].id;
    } else {
        // Insert new record
        const result = await client.query(`
            INSERT INTO dcs.admissions (
                "IsRefferal", "RefferedById", "MemberId", "MemberCateogryId",
                "ApplicantsName", "MainIdTypeId", "IdNo", "DOB",
                "MotherName", "FatherName", "Phone", "PresentAddress",
                "PermanentAddress", "MaritalStatusId", "Occupation", "NomineeName",
                "GenderId", "SavingsProductId", "branchcode", "projectcode",
                "entollmentid", "orgno", "assignedpo", "DynamicFieldValue", 
                "created_at", "updated_at", "status", "action", "reciverrole", "roleid", "Flag"
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 
                $17, $18, $19, $20, $21, $22, $23, $24, $25, $26,
                'PENDING', 'CREATE', 1, 1, $27
            ) RETURNING id`,
            [data.IsRefferal, data.RefferedById, data.MemberId, data.MemberCateogryId,
             data.ApplicantsName, data.MainIdTypeId, data.IdNo, data.DOB,
             data.MotherName, data.FatherName, data.Phone, data.PresentAddress,
             data.PermanentAddress, data.MaritalStatusId, data.Occupation, data.NomineeName,
             data.GenderId, data.SavingsProductId, data.branchcode, data.projectcode,
             data.entollmentid, data.orgno, data.assignedpo, dynamicFieldValue,
             data.created_at, data.updated_at, data.Flag]
        );
        return result.rows[0].id;
    }
}

// Validate UUID format
function isValidUUID(str) {
    if (!str) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
}

module.exports = {
    admissionStore: exports.admissionStore
};

