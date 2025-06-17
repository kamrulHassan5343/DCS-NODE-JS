const AdmissionStoreService = require('../services/admissionStoreService');

const logger = require('../utils/logger');

class AdmissionController {
    constructor() {
        this.admissionService = new AdmissionStoreService();
    }

    async handleAdmissionStore(req, res) {
        try {
            logger.info('Received admission store request');
            
            // The request validation middleware already validated the structure
            // so we can proceed directly to processing
            const result = await this.admissionService.processAdmission(req.body);
            
            logger.info('Admission processed successfully');
            res.status(200).json(result);
            
        } catch (error) {
            logger.error('Admission processing failed:', error);
            
            const statusCode = error.statusCode || 500;
            const message = error.message || 'Internal server error';
            
            res.status(statusCode).json({
                status: "E",
                message: message
            });
        }
    }
}

module.exports = AdmissionController;