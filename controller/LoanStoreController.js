const axios = require('axios');
const moment = require('moment');
const { pool } = require('../config/config'); // Assuming you have this config file
const logger = require('../utils/logger'); // Assuming you have this logger utility

// Helper function to pad strings with zeros
const padZero = (str, length) => {
    return str.toString().padStart(length, '0');
};

// Helper function to validate token
const validateToken = (token) => {
    return token === '7f30f4491cb4435984616d1913e88389';
};

// Helper function to get server URL
const getServerUrl = async (client, db) => {
    try {
        const query = `SELECT url, url2, server_url, maintenance_message, maintenance_status 
                      FROM ${db}.server_url 
                      WHERE server_status = 3 AND status = 1 
                      LIMIT 1`;
        
        const result = await client.query(query);
        
        if (result.rows.length === 0) {
            return {
                status: "CUSTMSG",
                message: "Server Api Not Found"
            };
        }
        
        const serverData = result.rows[0];
        
        if (serverData.maintenance_status === '1') {
            return {
                status: "CUSTMSG",
                message: serverData.maintenance_message
            };
        }
        
        return [serverData.url, serverData.url2, serverData.server_url];
    } catch (error) {
        logger.error('Error getting server URL:', error);
        throw error;
    }
};

// Helper function to make HTTP request
const makeHttpRequest = async (url) => {
    try {
        const response = await axios.get(url, {
            timeout: 30000,
            headers: {
                'User-Agent': 'Node.js Application'
            }
        });
        return response.data;
    } catch (error) {
        logger.error('HTTP request failed:', error);
        throw error;
    }
};

// Main controller function
exports.LoanRcaDataStore = async (req, res, next) => {

    console.log('LoanRcaDataStore oky');
    const client = await pool.connect();
    
    try {
        // Get schema name from config or environment
        const db = process.env.DB_SCHEMA || 'dcs'; // Using 'dcs' as default schema
       const baseUrl = process.env.NODE_ENV === 'development'
  ? 'http://localhost:1001'
  : process.env.BASE_URL || req.protocol + '://' + req.get('host');

        
        // Handle JSON data - req.body.json is already an object, no need to parse
        const dataset = req.body.json;
        logger.info('Loan Rca Data: ' + JSON.stringify(dataset));
        
        // Validate that dataset exists and has required structure
        if (!dataset || !dataset.loan || !dataset.rca) {
            return res.json({
                status: 'E',
                message: 'Invalid request structure. Missing loan or rca data.'
            });
        }
        
        if (!Array.isArray(dataset.loan) || !Array.isArray(dataset.rca)) {
            return res.json({
                status: 'E',
                message: 'Loan and RCA data must be arrays.'
            });
        }
        
        if (dataset.loan.length === 0 || dataset.rca.length === 0) {
            return res.json({
                status: 'E',
                message: 'Loan and RCA arrays cannot be empty.'
            });
        }
        
        const data = dataset.loan[0];
        const dataRca = dataset.rca[0];
        
        // Extract and format data
        let projectcode = padZero(data.project_code, 3);
        const token = req.body.token;
        let branchcode = padZero(data.branch_code, 4);
        
        // Validate token
        if (!validateToken(token)) {
            return res.json({
                status: 'E',
                message: 'Token Invalid'
            });
        }
        
        // Check if orgmemno is empty
        if (!data.orgmemno || data.orgmemno === '') {
            return res.json({
                status: 'E',
                message: 'দয়া করে প্রথম পেজে সিঙ্ক করে তারপরে আবার ট্রাই করুন।'
            });
        }
        
        // Initialize variables
        const roleid = 0;
        let reciverrole = 1;
        const status = 1;
        const orgno = data.vo_code;
        const loanid = data.loan_id;
        const pin = data.pin;
        const assignedpo = data.pin;
        const updatedate = moment().format('YYYY-MM-DD HH:mm:ss');
        
        // Extract all loan data
        const loanData = {
            mem_id: data.mem_id || null, // Handle null/undefined mem_id
            loan_product: data.loan_product,
            loan_duration: data.loan_duration,
            invest_sector: data.invest_sector,
            propos_amt: data.propos_amt,
            instal_amt: data.instal_amt,
            bracloan_family: data.bracloan_family,
            vo_leader: data.vo_leader,
            recommender: data.recommender,
            grntor_name: data.grntor_name,
            grntor_phone: data.grntor_phone,
            grntor_rlationClient: data.grntor_rlationClient,
            grntor_nid: data.grntor_nid,
            witness_knows: data.witness_knows,
            residence_type: data.residence_type,
            residence_duration: data.residence_duration,
            houseowner_knows: data.houseowner_knows || null,
            reltive_presAddress: data.reltive_presAddress,
            reltive_name: data.reltive_name,
            reltive_phone: data.reltive_phone,
            insurn_type: data.insurn_type,
            insurn_option: data.insurn_option,
            insurn_spouseName: data.insurn_spouseName,
            insurn_spouseNid: data.insurn_spouseNid,
            insurn_spouseDob: data.insurn_spouseDob,
            insurn_gender: data.insurn_gender,
            insurn_relation: data.insurn_relation,
            insurn_name: data.insurn_name,
            insurn_dob: data.insurn_dob,
            insurn_mainID: data.insurn_mainID,
            grantor_nidfront_photo: data.grantor_nidfront_photo,
            grantor_nidback_photo: data.grantor_nidback_photo,
            grantor_photo: data.grantor_photo,
            erp_mem_id: data.erp_mem_id,
            memberTypeId: data.memberTypeId,
            subSectorId: data.subSectorId,
            frequencyId: data.frequencyId,
            insurn_mainIDType: data.insurn_mainIDType,
            insurn_id_expire: data.insurn_id_expire,
            insurn_placeofissue: data.insurn_placeofissue,
            surveyid: data.surveyid,
            orgmemno: data.orgmemno,
            amount_inword: data.amount_inword,
            loan_purpose: data.loan_purpose,
            loan_user: data.loan_user,
            loan_type: data.loan_type,
            brac_loancount: data.brac_loancount,
            approval_amount: data.propos_amt,
            premium_amount: data.premium_amount || null,
            savings_selected_Items: data.savings_selected_Items ? JSON.stringify(JSON.parse(data.savings_selected_Items)) : null,
            passbook_required: data.passbook_required || null,
            quotation_paper_Image: data.quotation_paper_Image || null,
            previous_loan_amt: data.prevLoanAmnt || null,
            previous_loan_instlmnt: data.prevLoanDuration || null,
            profile_enrolment_id: data.profile_enrolment_id || null,
            csi_insurer_name: data.csi_insurer_name || 0,
            DynamicFieldValue: data.extra || null,
            scheme: data.scheme,
            projectcode: projectcode,
            branchcode: branchcode,
            pin: pin,
            roleid: roleid,
            reciverrole: reciverrole,
            status: status,
            loan_id: loanid,
            assignedpo: assignedpo,
            orgno: orgno,
            update_at: updatedate
        };
        
        // Get server URLs
        const serverUrls = await getServerUrl(client, db);
        if (serverUrls.status) {
            return res.json(serverUrls);
        }
        
        const [url, url2, baseurl] = serverUrls;
        
        // Make API call to get member data
        const memberUrl = `${url}MemberList?BranchCode=${branchcode}&ProjectCode=${projectcode}&CONo=${assignedpo}&OrgNo=${orgno}&OrgMemNo=${data.orgmemno}&key=5d0a4a85-df7a-scapi-bits-93eb-145f6a9902ae&Status=2`;
        
        try {
            const memberData = await makeHttpRequest(memberUrl);
            const memberDecode = typeof memberData === 'string' ? JSON.parse(memberData) : memberData;
            
            if (memberDecode.data && memberDecode.data.length > 0) {
                const memberInfo = memberDecode.data;
                if (memberInfo.length === 1) {
                    const loanCycleNo = memberInfo[0].LoanCycleNo;
                    if (loanCycleNo > 0) {
                        loanData.loan_type = 'Repeat';
                        loanData.brac_loancount = loanCycleNo;
                    }
                }
            }
        } catch (error) {
            logger.error('Error fetching member data:', error);
        }
        
        // Start transaction
        await client.query('BEGIN');
        
        try {
            // Check if loan exists
            const checkQuery = `SELECT id, loan_id FROM ${db}.loans WHERE loan_id = $1`;
            const checkResult = await client.query(checkQuery, [loanid]);
            
            let docId;
            
            if (checkResult.rows.length === 0) {
                // Insert new loan
                const insertFields = Object.keys(loanData).map((key, index) => `"${key}"`).join(', ');
                const insertValues = Object.keys(loanData).map((_, index) => `$${index + 1}`).join(', ');
                const insertQuery = `INSERT INTO ${db}.loans (${insertFields}) VALUES (${insertValues}) RETURNING id`;
                
                const insertResult = await client.query(insertQuery, Object.values(loanData));
                docId = insertResult.rows[0].id;
            } else {
                // Update existing loan
                docId = checkResult.rows[0].id;
                const existingLoanId = checkResult.rows[0].loan_id;
                
                const updateFields = Object.keys(loanData).map((key, index) => `"${key}" = $${index + 1}`).join(', ');
                const updateQuery = `UPDATE ${db}.loans SET ${updateFields} WHERE loan_id = $${Object.keys(loanData).length + 1}`;
                
                await client.query(updateQuery, [...Object.values(loanData), existingLoanId]);
            }
            
            // Prepare RCA data
            const rcaData = {
                loan_id: docId,
                primary_earner: dataRca.primary_earner || 1,
                monthlyincome_main: dataRca.monthlyincome_main,
                monthlyincome_other: dataRca.monthlyincome_other,
                house_rent: dataRca.house_rent,
                food: dataRca.food,
                education: dataRca.education,
                medical: dataRca.medical,
                festive: dataRca.festive,
                utility: dataRca.utility,
                saving: dataRca.saving,
                other: dataRca.other,
                monthly_instal: dataRca.monthly_instal,
                debt: dataRca.debt,
                monthly_cash: dataRca.monthly_cash,
                monthlyincome_spouse_child: dataRca.monthlyincome_spouse_child,
                instal_proposloan: dataRca.instal_proposloan,
                DynamicFieldValue: dataRca.extra || null,
                po_seasonal_income: dataRca.po_seasonal_income,
                po_incomeformfixedassets: dataRca.po_incomeformfixedassets,
                po_imcomeformsavings: dataRca.po_imcomeformsavings,
                po_houseconstructioncost: dataRca.po_houseconstructioncost,
                po_expendingonmarriage: dataRca.po_expendingonmarriage,
                po_operation_childBirth: dataRca.po_operation_childBirth,
                po_foreigntravel: dataRca.po_foreigntravel
            };
            
            // Insert or update RCA data
            if (checkResult.rows.length === 0) {
                // Insert new RCA
                const rcaInsertFields = Object.keys(rcaData).map((key, index) => `"${key}"`).join(', ');
                const rcaInsertValues = Object.keys(rcaData).map((_, index) => `$${index + 1}`).join(', ');
                const rcaInsertQuery = `INSERT INTO ${db}.rca (${rcaInsertFields}) VALUES (${rcaInsertValues})`;
                
                await client.query(rcaInsertQuery, Object.values(rcaData));
            } else {
                // Update existing RCA
                const rcaUpdateFields = Object.keys(rcaData).map((key, index) => `"${key}" = $${index + 1}`).join(', ');
                const rcaUpdateQuery = `UPDATE ${db}.rca SET ${rcaUpdateFields} WHERE loan_id = $${Object.keys(rcaData).length + 1}`;
                
                await client.query(rcaUpdateQuery, [...Object.values(rcaData), docId]);
            }
            
            // Commit transaction
            await client.query('COMMIT');
            
            // Make document manager API call
            const documentUrl = `${baseUrl}/DocumentManager?doc_id=${docId}&projectcode=${projectcode}&doc_type=loan&pin=${pin}&role=0&branchcode=${branchcode}&action=Request`;
            logger.info('Document_url : ' + documentUrl);
            
            try {
                const documentResponse = await makeHttpRequest(documentUrl);
                const documentResult = typeof documentResponse === 'string' ? JSON.parse(documentResponse) : documentResponse;
                
                if (documentResult.status === 'S') {
                    // Success response
                    const result = {
                        status: "S",
                        message: "অভিনন্দন! লোনের আবেদন সফলভাবে পাঠানো হয়েছে।\n•আবেদনের অবস্থান জানতে নোটিফিকেশন ও স্ট্যাটাস চেক করুন।"
                    };
                    
                    // Here you would typically create notification
                    // (new CreateNotificationService())->create_notification(...)
                    
                    return res.json(result);
                } else {
                    return res.json(documentResult);
                }
            } catch (docError) {
                logger.error('Document manager API error:', docError);
                return res.json({
                    status: 'E',
                    message: 'Document processing failed'
                });
            }
            
        } catch (dbError) {
            await client.query('ROLLBACK');
            logger.error('Database error:', dbError);
            return res.json({
                status: 'E',
                message: dbError.message
            });
        }
        
    } catch (error) {
        logger.error('Main error:', error);
        return res.json({
            status: 'E',
            message: error.message
        });
    } finally {
        client.release();
    }
};





