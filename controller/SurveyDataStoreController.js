const { pool } = require('../config/config');
const logger = require('../utils/logger');
const { body, validationResult } = require('express-validator');

exports.SurveyDataStore = async (req, res, next) => {
    // Validation start
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => error.msg).join('\n');
        return res.status(400).json({ status: 'E', message: errorMessages });
    }
    // Validation end

    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const db = 'dcs'; // dcs db name
        const jsonData = req.body.json;
        logger.info('Survey Data: ' + JSON.stringify(jsonData));
        
        const dataset = jsonData; 
        const data = dataset.data[0];
        const dynamicfieldvalue = dataset.extra || null;
        const projectcode = String(data.project_code).padStart(3, '0');
        const token = req.body.token;

        if (token !== '7f30f4491cb4435984616d1913e88389') {
            throw new Error('Invalid token!');
        }

        const entollmentid = data.entollmentid;
        const branchcode = String(data.branch_code).padStart(4, '0');
        const name = data.applicant_name;
        const mainidtypeid = data.mainid_type;
        const idno = data.mainid_number;
        const phone = data.phone;
        const status = 'active';
        const targetdate = data.expiredate;
        const assignedpo = data.pin;
        const orgno = data.vo_code;
        const survey_status = 'completed';
        const houseName = data.present_adds;
        const roadNo = data.present_adds.includes('Road') ? data.present_adds.split('Road')[0] + 'Road' : '';
        const union = data.present_upazila ? `Union ${data.present_upazila}` : '';
        const productType = data.savingsProductId === 1 ? 'Savings' : 'Loan';
        const expectedLoanAmount = data.targetAmount || 0;
        const remarks = '';
        const currentDate = new Date().toISOString();

        const query = `
            INSERT INTO ${db}.surveys (
                entollmentid, name, mainidtypeid, idno, phone, status, 
                targetdate, dynamicfieldvalue, projectcode, branchcode, 
                assignedpo, orgno, survey_status, housename, road_no, 
                "union", producttype, expected_loan_amount, remarks, survey_date
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
            RETURNING id
        `;
        
        const values = [
            entollmentid, name, mainidtypeid, idno, phone, status,
            targetdate, dynamicfieldvalue, projectcode, branchcode,
            assignedpo, orgno, survey_status, houseName, roadNo,
            union, productType, expectedLoanAmount, remarks, currentDate
        ];

        const result = await client.query(query, values);
        
        if (result.rowCount > 0) {
            await client.query('COMMIT');
            res.json({ 
                status: 'S', 
                message: 'Data sent to server successfully', 
                surveyId: result.rows[0].id 
            });
        } else {
            throw new Error('Failed to insert survey data');
        }
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('Survey data store error: ' + error.message);
        res.status(500).json({ 
            status: 'E', 
            message: error.message,
            detail: error.detail // This will show more detailed PostgreSQL error if available
        });
    } finally {
        client.release();
    }
};

// Validation middleware remains the same

// Validation middleware
exports.validateSurveyData = [
    body('token').notEmpty().withMessage('Token is required'),
    body('json').isObject().withMessage('Invalid JSON data format'),
    body('json.data').isArray({ min: 1 }).withMessage('Data array must contain at least one item'),
    body('json.data.*.project_code').optional().isString().isLength({ max: 4 }).withMessage('Project code must not exceed 4 characters'),
    body('json.data.*.branch_code').optional().isString().isLength({ max: 4 }).withMessage('Branch code must not exceed 4 characters'),
    body('json.data.*.entollmentid').optional().isUUID().withMessage('Invalid UUID format for enrollment ID'),
    body('json.data.*.phone').optional().isString().isLength({ max: 11 }).withMessage('Phone number must not exceed 11 characters'),
    // Add more validations as needed
];