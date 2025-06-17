const Joi = require('joi');
const logger = require('../utils/logger');

// Member data schema
const memberSchema = Joi.object({
    project_code: Joi.string().required(),
    branch_code: Joi.string().required(),
    vo_code: Joi.string().required(), // Add this line
    enroll_id: Joi.string().guid({ version: 'uuidv4' }).required(),
    erp_mem_id: Joi.string().required(),
    pin: Joi.string().required(),
    is_ref: Joi.boolean().required(),
    // Include all other fields from your request
    applicant_name: Joi.string().required(),
    mainid_type: Joi.number().required(),
    mainid_number: Joi.string().required(),
    // ... add validation for all other fields
}).unknown(true); // This allows additional fields not specified in the schema

// Main request schema
const admissionSchema = Joi.object({
    json: Joi.object({
        flag: Joi.number().valid(1, 2).required(),
        data: Joi.array().items(memberSchema).min(1).required(),
        extra: Joi.string().allow('').optional()
    }).required(),
    token: Joi.string().required()
});

const validateAdmissionRequest = (req, res, next) => {
    const { error } = admissionSchema.validate(req.body, { abortEarly: false });
    
    if (error) {
        const errorDetails = error.details.map(detail => {
            return {
                message: detail.message,
                path: detail.path.join('.')
            };
        });
        
        logger.warn('Request validation failed:', errorDetails);
        return res.status(400).json({
            status: "E",
            message: errorDetails[0].message.replace(/"/g, "'"),
            errors: errorDetails
        });
    }
    next();
};

module.exports = { validateAdmissionRequest };