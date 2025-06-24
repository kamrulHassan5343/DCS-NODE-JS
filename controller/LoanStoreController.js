
const axios = require('axios');
const moment = require('moment');
const { pool } = require('../config/config');
const logger = require('../utils/logger');

// Constants
const VALID_TOKEN = '7f30f4491cb4435984616d1913e88389';
const MEMBER_API_KEY = '5d0a4a85-df7a-scapi-bits-93eb-145f6a9902ae';

// Helper functions
const padZero = (str, length) => str.toString().padStart(length, '0');
const validateToken = (token) => token === VALID_TOKEN;

const getServerUrl = async (client, db) => {
    const result = await client.query(`
        SELECT url, url2, server_url, maintenance_message, maintenance_status 
        FROM ${db}.server_url 
        WHERE server_status = 3 AND status = 1 
        LIMIT 1
    `);
    
    if (result.rows.length === 0) return { status: "CUSTMSG", message: "Server Api Not Found" };
    if (result.rows[0].maintenance_status === '1') {
        return { status: "CUSTMSG", message: result.rows[0].maintenance_message };
    }
    
    return [result.rows[0].url, result.rows[0].url2, result.rows[0].server_url];
};

const makeHttpRequest = async (url) => {
    const response = await axios.get(url, { timeout: 30000 });
    return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
};

exports.LoanRcaDataStore = async (req, res) => {
    const client = await pool.connect();
    
    try {
        const db = process.env.DB_SCHEMA || 'dcs';
        const baseUrl = process.env.NODE_ENV === 'development' 
            ? 'http://localhost:1001' 
            : process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

        const { json: dataset, token } = req.body;
        
        // Validate request
        if (!validateToken(token)) return res.json({ status: 'E', message: 'Token Invalid' });
        if (!dataset?.loan?.[0] || !dataset?.rca?.[0]) {
            return res.json({ status: 'E', message: 'Invalid request structure' });
        }
        if (!dataset.loan[0].orgmemno) {
            return res.json({ status: 'E', message: 'দয়া করে প্রথম পেজে সিঙ্ক করে তারপরে আবার ট্রাই করুন।' });
        }

        const [data, dataRca] = [dataset.loan[0], dataset.rca[0]];
        const projectcode = padZero(data.project_code, 3);
        const branchcode = padZero(data.branch_code, 4);
        
        // Prepare loan data
        const loanData = {
            mem_id: data.mem_id || null,
            loan_product: data.loan_product,
            loan_duration: data.loan_duration,
            invest_sector: data.invest_sector,
            propos_amt: data.propos_amt,
            instal_amt: data.instal_amt,
            // ... include other necessary fields
            projectcode,
            branchcode,
            pin: data.pin,
            roleid: 0,
            reciverrole: 1,
            status: 1,
            loan_id: data.loan_id,
            assignedpo: data.pin,
            orgno: data.vo_code,
            update_at: moment().format('YYYY-MM-DD HH:mm:ss')
        };

        // Get server URLs
        const serverUrls = await getServerUrl(client, db);
        if (serverUrls.status) return res.json(serverUrls);
        const [url] = serverUrls;

        // Fetch member data to check loan cycle
        try {
            const memberUrl = `${url}MemberList?BranchCode=${branchcode}&ProjectCode=${projectcode}&CONo=${data.pin}&OrgNo=${data.vo_code}&OrgMemNo=${data.orgmemno}&key=${MEMBER_API_KEY}&Status=2`;
            const memberData = await makeHttpRequest(memberUrl);
            
            if (memberData.data?.[0]?.LoanCycleNo > 0) {
                loanData.loan_type = 'Repeat';
                loanData.brac_loancount = memberData.data[0].LoanCycleNo;
            }
        } catch (error) {
            logger.error('Error fetching member data:', error);
        }

        await client.query('BEGIN');
        
        try {
            // Check if loan exists
            const checkResult = await client.query(`SELECT id FROM ${db}.loans WHERE loan_id = $1`, [data.loan_id]);
            const docId = checkResult.rows[0]?.id;

            if (!docId) {
                // Insert new loan
                const insertResult = await client.query(
                    `INSERT INTO ${db}.loans (${Object.keys(loanData).map(k => `"${k}"`).join(', ')}) 
                    VALUES (${Object.keys(loanData).map((_, i) => `$${i+1}`).join(', ')}) RETURNING id`,
                    Object.values(loanData)
                );
                docId = insertResult.rows[0].id;
            } else {
                // Update existing loan
                await client.query(
                    `UPDATE ${db}.loans SET ${Object.keys(loanData).map((k, i) => `"${k}" = $${i+1}`).join(', ')} 
                    WHERE loan_id = $${Object.keys(loanData).length + 1}`,
                    [...Object.values(loanData), data.loan_id]
                );
            }

            // Prepare and insert/update RCA data
            const rcaData = {
                loan_id: docId,
                primary_earner: dataRca.primary_earner || 1,
                monthlyincome_main: dataRca.monthlyincome_main,
                // ... include other necessary RCA fields
            };

            if (!checkResult.rows[0]) {
                await client.query(
                    `INSERT INTO ${db}.rca (${Object.keys(rcaData).map(k => `"${k}"`).join(', ')}) 
                    VALUES (${Object.keys(rcaData).map((_, i) => `$${i+1}`).join(', ')})`,
                    Object.values(rcaData)
                );
            } else {
                await client.query(
                    `UPDATE ${db}.rca SET ${Object.keys(rcaData).map((k, i) => `"${k}" = $${i+1}`).join(', ')} 
                    WHERE loan_id = $${Object.keys(rcaData).length + 1}`,
                    [...Object.values(rcaData), docId]
                );
            }

            await client.query('COMMIT');

            // Call document manager
            const documentUrl = `${baseUrl}/DocumentManager?doc_id=${docId}&projectcode=${projectcode}&doc_type=loan&pin=${data.pin}&role=0&branchcode=${branchcode}&action=Request`;
            const documentResponse = await makeHttpRequest(documentUrl);

            if (documentResponse.status === 'S') {
                return res.json({
                    status: "S",
                    message: "অভিনন্দন! লোনের আবেদন সফলভাবে পাঠানো হয়েছে।\n•আবেদনের অবস্থান জানতে নোটিফিকেশন ও স্ট্যাটাস চেক করুন।"
                });
            }
            return res.json(documentResponse);

        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Transaction error:', error);
            return res.json({ status: 'E', message: error.message });
        }
    } catch (error) {
        logger.error('Controller error:', error);
        return res.json({ status: 'E', message: error.message });
    } finally {
        client.release();
    }
};




