const { pool } = require('../config/config');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

const formatSurveyData = (data, extra) => ({
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
});

exports.SurveyDataStore = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            status: 'E', 
            message: errors.array().map(err => err.msg).join('\n') 
        });
    }

    const { json, token } = req.body;
    if (token !== '7f30f4491cb4435984616d1913e88389') {
        return res.status(401).json({ status: 'E', message: 'Invalid token!' });
    }

    const client = await pool.connect();
    try {
        const survey = formatSurveyData(json.data[0], json.extra);
        logger.info('Survey Data:', survey);

        // Fixed column names (quoted reserved keywords)
        const columns = [
            'entollmentid', 'name', 'mainidtypeid', 'idno', 'phone', 'status',
            'targetdate', 'dynamicfieldvalue', 'projectcode', 'branchcode',
            'assignedpo', 'orgno', 'survey_status', 'housename', 'road_no',
            '"union"', 'producttype', 'expected_loan_amount', 'remarks', 'survey_date'
        ];

        const query = `
            INSERT INTO dcs.surveys (
                ${columns.join(', ')}
            ) VALUES (
                ${columns.map((_, i) => `$${i+1}`).join(', ')}
            ) RETURNING id
        `;

        await client.query('BEGIN');
        const { rows } = await client.query(query, Object.values(survey));
        await client.query('COMMIT');

        return res.json({
            status: 'S',
            message: 'Data sent to server successfully',
            surveyId: rows[0].id
        });

    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('SurveyDataStore error:', error);
        return res.status(500).json({
            status: 'E',
            message: error.message,
            detail: error.detail || null
        });
    } finally {
        client.release();
    }
};