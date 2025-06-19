const { Pool } = require('pg');
const moment = require('moment');
const { pool } = require('../config/config');
const logger = require('../utils/logger');

exports.BmLoanAssessment = async (req, res) => {
    const client = await pool.connect();
    
    try {
        // Log full request details for debugging
        logger.debug('BM Loan Assessment Request Details', {
            headers: req.headers,
            body: req.body,
            timestamp: moment().format()
        });

        // Validate token from header
        const token = req.headers.apikey;
        if (token !== '7f30f4491cb4435984616d1913e88389') {
            logger.warn('Invalid token attempt', { receivedToken: token });
            return res.status(400).json({ status: 'E', message: 'Invalid token!' });
        }

        const dataset = req.body;
        logger.debug('Request dataset parsed', { dataset });

        // Validate loan checklist data
        const dataLoan = dataset.loan_checklist;
        if (!dataLoan || dataLoan.length === 0) {
            logger.error('Loan checklist data missing');
            return res.status(400).json({ status: 'E', message: 'Loan checklist data is required' });
        }

        await client.query('BEGIN');
        logger.debug('Transaction begun');

        // Extract and validate parameters
        const projectcode = String(dataLoan[0].project_code).padStart(3, '0');
        const branchcode = String(dataLoan[0].branch_code).padStart(4, '0');
        const vocode = dataLoan[0].vo_code;
        const erp_mem_id = dataLoan[0].erp_mem_id;
        const orgno = vocode;
        const loan_id = dataLoan[0].loan_id;

        logger.debug('Extracted parameters', {
            projectcode, branchcode, vocode, erp_mem_id, loan_id
        });

        if (!loan_id) {
            logger.error('Loan ID missing from request');
            return res.status(400).json({ status: 'E', message: 'Loan ID cannot be empty' });
        }

        // Verify loan exists with enhanced debugging
        const loanQuery = `SELECT id, "quotation_paper_Image" FROM dcs.loans WHERE loan_id = $1`;
        logger.debug('Executing loan query', { query: loanQuery, params: [loan_id] });
        
        const loanResult = await client.query(loanQuery, [loan_id]);
        logger.debug('Loan query results', { rowCount: loanResult.rowCount });

        if (loanResult.rows.length === 0) {
            // Additional diagnostic checks
            const similarLoans = await client.query(
                `SELECT loan_id FROM dcs.loans WHERE orgno = $1 AND branchcode = $2 LIMIT 5`,
                [orgno, branchcode]
            );
            
            logger.error('Loan not found', {
                loan_id,
                similarLoans: similarLoans.rows,
                fullQuery: { text: loanQuery, values: [loan_id] }
            });

            return res.status(404).json({ 
                status: 'E', 
                message: `Loan with ID '${loan_id}' not found.`,
                suggestion: similarLoans.rows.length > 0 
                    ? `Possible loans for this VO: ${similarLoans.rows.map(l => l.loan_id).join(', ')}`
                    : 'No loans found for this VO/branch'
            });
        }

        const loan = loanResult.rows[0].id;
        const currentQuotationImage = loanResult.rows[0].quotation_paper_Image;
        logger.debug('Loan found', { loan_id, internal_id: loan });

        // Prepare loan data with validation
        const loanData = {
            bm_repay_loan: dataLoan[0].bm_repay_loan || null,
            bm_conduct_activity: dataLoan[0].bm_conduct_activity || null,
            bm_action_required: dataLoan[0].bm_action_required || null,
            bm_rca_rating: dataLoan[0].bm_rca_rating || null,
            bm_noofChild: dataLoan[0].bm_noofChild || null,
            bm_earningMember: dataLoan[0].bm_earningMember || null,
            bm_duration: dataLoan[0].bm_duration || null,
            bm_hometown: dataLoan[0].bm_hometown === 'Yes' ? 0 : 1,
            bm_landloard: dataLoan[0].bm_landloard === 'Yes' ? 0 : 1,
            bm_recomand: dataLoan[0].bm_recomand === 'Yes' ? 0 : 1,
            bm_occupation: dataLoan[0].bm_occupation === 'Yes' ? 0 : 1,
            bm_aware: dataLoan[0].bm_aware === 'Yes' ? 0 : 1,
            bm_grantor: dataLoan[0].bm_grantor === 'Yes' ? 0 : 1,
            bm_socialAcecptRating: dataLoan[0].bm_socialAcecptRating || null,
            bm_grantorRating: dataLoan[0].bm_grantorRating || null,
            bm_clienthouse: dataLoan[0].bm_clienthouse || null,
            bm_remarks: dataLoan[0].bm_remarks || null,
            approval_amount: dataLoan[0].approval_amount || null,
            quotation_paper_Image: dataLoan[0].bm_quotationImg || currentQuotationImage,
            update_at: moment().format('YYYY-MM-DD HH:mm:ss')
        };

        logger.debug('Prepared loan update data', { loanData });

        // Update loan data
        const updateLoanQuery = `
            UPDATE dcs.loans 
            SET ${Object.keys(loanData).map((key, i) => `"${key}" = $${i + 1}`).join(', ')} 
            WHERE "loan_id" = $${Object.keys(loanData).length + 1}`;
            
        const updateLoanValues = [...Object.values(loanData), loan_id];
        
        logger.debug('Executing loan update', {
            query: updateLoanQuery,
            values: updateLoanValues.map(v => typeof v === 'string' ? v.substring(0, 50) + (v.length > 50 ? '...' : '') : v)
        });

        await client.query(updateLoanQuery, updateLoanValues);
        logger.debug('Loan update successful');

        // Process RCA data if exists
        if (dataset.rca && dataset.rca.length > 0) {
            const dataRca = dataset.rca[0];
            logger.debug('Processing RCA data', { rcaData: dataRca });

            const rcaData = {
                bm_monthlyincome_main: dataRca.bm_monthlyincome_main || null,
                bm_monthlyincome_spouse_child: dataRca.bm_monthlyincome_spouse_child || null,
                bm_monthlyincome_other: dataRca.bm_monthlyincome_other || null,
                bm_house_rent: dataRca.bm_house_rent || null,
                bm_food: dataRca.bm_food || null,
                bm_education: dataRca.bm_education || null,
                bm_medical: dataRca.bm_medical || null,
                bm_festive: dataRca.bm_festive || null,
                bm_utility: dataRca.bm_utility || null,
                bm_saving: dataRca.bm_saving || null,
                bm_other: dataRca.bm_other || null,
                bm_monthly_instal: dataRca.bm_monthly_instal || null,
                bm_debt: dataRca.bm_debt || null,
                bm_monthly_cash: dataRca.bm_monthly_cash || null,
                bm_instal_proposloan: dataRca.bm_instal_proposloan || null,
                bm_seasonal_income: dataRca.bm_seasonal_income || null,
                bm_incomeformfixedassets: dataRca.bm_incomeformfixedassets || null,
                bm_imcomeformsavings: dataRca.bm_imcomeformsavings || null,
                bm_houseconstructioncost: dataRca.bm_houseconstructioncost || null,
                bm_expendingonmarriage: dataRca.bm_expendingonmarriage || null,
                bm_operation_childBirth: dataRca.bm_operation_childBirth || null,
                bm_foreigntravel: dataRca.bm_foreigntravel || null,
                bm_tolerance: dataRca.bm_tolerance || null
            };

            const updateRcaQuery = `
                UPDATE dcs.rca 
                SET ${Object.keys(rcaData).map((key, i) => `"${key}" = $${i + 1}`).join(', ')} 
                WHERE "loan_id" = $${Object.keys(rcaData).length + 1}`;
                
            const updateRcaValues = [...Object.values(rcaData), loan];
            
            logger.debug('Executing RCA update', {
                query: updateRcaQuery,
                values: updateRcaValues
            });

            await client.query(updateRcaQuery, updateRcaValues);
            logger.debug('RCA update successful');
        }

        await client.query('COMMIT');
        logger.info(`BM Loan Assessment completed successfully for loan ${loan_id}`);
        
        return res.json({ 
            status: "S", 
            message: "Data saved successfully",
            loan_id: loan_id,
            timestamp: moment().format()
        });

    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('BM Loan Assessment Failed', {
            error: {
                message: error.message,
                stack: error.stack,
                code: error.code,
                detail: error.detail
            },
            request: {
                body: req.body,
                headers: req.headers
            },
            timestamp: moment().format()
        });
        
        return res.status(500).json({ 
            status: 'E', 
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? {
                message: error.message,
                code: error.code,
                detail: error.detail
            } : undefined
        });
    } finally {
        client.release();
        logger.debug('Database connection released');
    }
};