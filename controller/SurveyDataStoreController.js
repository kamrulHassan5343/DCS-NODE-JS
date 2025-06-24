const { pool } = require('../config/config');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

// Helper: Format input data
const formatSurveyData = (data, extra) => {
    return {
        entollmentid: data.entollmentid,
        name: data.applicant_name,
        mainidtypeid: data.mainid_type,
        idno: data.mainid_number,
        phone: data.phone,
        status: 'active',
        targetdate: data.expiredate,
        dynamicfieldvalue: extra || null,
        projectcode: String(data.project_code).padStart(3, '0'),
        branchcode: String(data.branch_code).padStart(4, '0'),
        assignedpo: data.pin,
        orgno: data.vo_code,
        survey_status: 'completed',
        housename: data.present_adds,
        road_no: data.present_adds.includes('Road') ? data.present_adds.split('Road')[0] + 'Road' : '',
        union: data.present_upazila ? `Union ${data.present_upazila}` : '',
        producttype: data.savingsProductId === 1 ? 'Savings' : 'Loan',
        expected_loan_amount: data.targetAmount || 0,
        remarks: '',
        survey_date: new Date().toISOString()
    };
};

exports.SurveyDataStore = async (req, res) => {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const message = errors.array().map(err => err.msg).join('\n');
        return res.status(400).json({ status: 'E', message });
    }

    const client = await pool.connect();
    try {
        const { json, token } = req.body;
        const data = json.data[0]; // Assume only one record
        const extra = json.extra;

        logger.info('Survey Data:', data);

        if (token !== '7f30f4491cb4435984616d1913e88389') {
            return res.status(401).json({ status: 'E', message: 'Invalid token!' });
        }

        const survey = formatSurveyData(data, extra);

        const query = `
            INSERT INTO dcs.surveys (
                entollmentid, name, mainidtypeid, idno, phone, status, 
                targetdate, dynamicfieldvalue, projectcode, branchcode, 
                assignedpo, orgno, survey_status, housename, road_no, 
                "union", producttype, expected_loan_amount, remarks, survey_date
            ) VALUES (
                $1, $2, $3, $4, $5, $6, 
                $7, $8, $9, $10, 
                $11, $12, $13, $14, $15, 
                $16, $17, $18, $19, $20
            ) RETURNING id
        `;

        const values = Object.values(survey);

        await client.query('BEGIN');
        const result = await client.query(query, values);
        await client.query('COMMIT');

        if (result.rowCount > 0) {
            return res.json({
                status: 'S',
                message: 'Data sent to server successfully',
                surveyId: result.rows[0].id
            });
        } else {
            throw new Error('Survey insertion failed');
        }

    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('SurveyDataStore error: ' + error.message);
        return res.status(500).json({
            status: 'E',
            message: error.message,
            detail: error.detail || null
        });
    } finally {
        client.release();
    }
};
