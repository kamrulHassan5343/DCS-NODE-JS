
const { pool } = require('../config/config');
const logger = require('../utils/logger');

// Helper functions would be defined here or imported from another file

exports.document_manager = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('SET search_path TO dcs, public');

        // Extract and validate required parameters
        const { 
            branchCode, branchcode,
            projectCode, projectcode,
            pin,
            entollmentid,
            doc_type,
            doc_id,
            role: roleid,
            action,
            comment,
            sender
        } = req.body;

        const finalBranchCode = branchCode || branchcode;
        const finalProjectCode = projectCode || projectcode;
        const username = req.headers['username'] || null;

        if (!finalBranchCode || !finalProjectCode || !pin || !doc_type) {
            return res.status(400).json({
                status: 'E',
                message: 'Missing required parameters'
            });
        }

        // Log the request
        logger.info(`Document manager request: ${JSON.stringify(req.body)}`);

        // Determine process ID based on doc_type
        const processMap = {
            'admission': 'member admission',
            'loan': 'loan application'
        };

        if (!processMap[doc_type]) {
            return res.status(404).json({ 
                status: 'E', 
                message: 'Invalid document type' 
            });
        }

        const processRes = await client.query(
            'SELECT id FROM processes WHERE process = $1', 
            [processMap[doc_type]]
        );

        if (!processRes.rows.length) {
            return res.status(404).json({ 
                status: 'E', 
                message: `Process "${processMap[doc_type]}" not found` 
            });
        }

        const processid = processRes.rows[0].id;

        // Handle document ID and enrollment ID
        let finalDocId = doc_id;
        let finalEntollmentId = entollmentid;

        if (!doc_id && entollmentid) {
            const table = doc_type === 'admission' ? 'admissions' : 'loans';
            const idField = doc_type === 'admission' ? 'entollmentid' : 'loan_id';
            
            const docRes = await client.query(
                `SELECT id FROM ${table} WHERE ${idField} = $1`, 
                [entollmentid]
            );
            
            if (!docRes.rows.length) {
                return res.status(404).json({ 
                    status: 'E', 
                    message: 'Document not found' 
                });
            }
            
            finalDocId = docRes.rows[0].id;
        } else if (doc_id && !entollmentid) {
            const table = doc_type === 'admission' ? 'admissions' : 'loans';
            const idField = doc_type === 'admission' ? 'entollmentid' : 'loan_id';
            
            const docRes = await client.query(
                `SELECT ${idField} FROM ${table} WHERE id = $1`, 
                [doc_id]
            );
            
            if (!docRes.rows.length) {
                return res.status(404).json({ 
                    status: 'E', 
                    message: 'Document not found' 
                });
            }
            
            finalEntollmentId = docRes.rows[0][idField];
        }

        // Get document details
        const table = doc_type === 'admission' ? 'admissions' : 'loans';
        const docRes = await client.query(
            `SELECT * FROM ${table} WHERE id = $1`, 
            [finalDocId]
        );

        if (!docRes.rows.length) {
            return res.status(404).json({ 
                status: 'E', 
                message: 'Document not found' 
            });
        }

        const document = docRes.rows[0];
        const reciverrole = document.reciverrole;
        const status = 1;

        // Get action ID
        const actionRes = await client.query(
            'SELECT id FROM action_lists WHERE actionname = $1 AND process_id = $2 AND projectcode = $3',
            [action, processid, finalProjectCode]
        );

        if (!actionRes.rows.length) {
            return res.status(404).json({ 
                status: 'E', 
                message: 'Action not found' 
            });
        }

        const actionid = actionRes.rows[0].id;

        // Handle different actions
        if (action === 'Request' || action === 'Modify') {
            await client.query('BEGIN');

            // Insert document history
            const historyRes = await client.query(
                `INSERT INTO document_history 
                (doc_id, doc_type, pin, action, projectcode, roleid, reciverrole) 
                VALUES ($1, $2, $3, $4, $5, $6, $7) 
                RETURNING id`,
                [finalDocId, doc_type, pin, actionid, finalProjectCode, roleid, reciverrole]
            );

            const dochistory_id = historyRes.rows[0].id;

            // Update document status
            const updateQuery = `
                UPDATE ${table} 
                SET dochistory_id = $1, roleid = $2, pin = $3, 
                    reciverrole = $4, status = $5, sender = $6 
                WHERE id = $7
            `;

            await client.query(updateQuery, [
                dochistory_id, roleid, pin, reciverrole, status, sender, finalDocId
            ]);

            await client.query('COMMIT');
            
            return res.json({ 
                status: "S", 
                message: "Document processed successfully" 
            });
        } else {
            // Handle other actions (Recommend, Sendback, Reject, Approve)
            if (roleid != reciverrole) {
                return res.status(400).json({ 
                    status: 'E', 
                    message: 'Document already processed' 
                });
            }

            // Simplified response for other actions
            const actionMessages = {
                'Recommend': "সফলভাবে সুপারিশ করা হয়েছে",
                'Sendback': "সফলভাবে সেন্ডব্যাক করা হয়েছে",
                'Reject': "সফলভাবে রিজেক্ট করা হয়েছে",
                'Approve': "সফলভাবে অনুমোদন করা হয়েছে"
            };

            if (!actionMessages[action]) {
                return res.status(400).json({ 
                    status: 'E', 
                    message: 'Invalid action' 
                });
            }

            return res.json({
                status: "CUSTMSG",
                title: `${action}-`,
                message: `অভিনন্দন! ${doc_type === 'loan' ? 'লোনের আবেদন' : 'আবেদন'} ${actionMessages[action]}।`
            });
        }
    } catch (err) {
        await client.query('ROLLBACK');
        logger.error('Error in document_manager:', err);
        return res.status(500).json({
            status: 'E',
            message: 'Internal server error'
        });
    } finally {
        client.release();
    }
};

exports.DocumentManager = async (req, res) => {
    try {
        const { 
            doc_id, 
            projectcode, 
            doc_type, 
            pin, 
            role, 
            branchcode, 
            action 
        } = req.query;

        logger.info(`DocumentManager called with params: ${JSON.stringify(req.query)}`);

        if (!doc_id || !projectcode || !doc_type || !pin || !branchcode || !action) {
            return res.status(400).json({
                status: 'E',
                message: 'Missing required parameters'
            });
        }

        const client = await pool.connect();
        
        try {
            const db = process.env.DB_SCHEMA || 'dcs';
            
            // Update document status
            await client.query(
                `UPDATE ${db}.loans 
                SET status = $1, processed_at = CURRENT_TIMESTAMP 
                WHERE id = $2`,
                [2, doc_id]
            );
            
            return res.json({
                status: 'S',
                message: 'Document processed successfully'
            });
            
        } catch (dbError) {
            logger.error('Database error:', dbError);
            return res.status(500).json({
                status: 'E',
                message: 'Database error'
            });
        } finally {
            client.release();
        }
    } catch (error) {
        logger.error('DocumentManager error:', error);
        return res.status(500).json({
            status: 'E',
            message: 'Internal server error'
        });
    }
};


