
const LiveApiNidVerificationService = require('../services/LiveApiNidVerificationService');
const { validationResult } = require('express-validator');

class NidVerificationController {
    constructor() {
        this.service = new LiveApiNidVerificationService();
        this.verifyNid = this.verifyNid.bind(this);
    }

    async verifyNid(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: "E",
                message: errors.array().map(error => error.msg).join("\n")
            });
        }

        try {
            const result = await this.service.nidVerify(req);
            const statusCode = (result.status === "ERROR" || result.status === "E") 
                ? (result.code || 500) 
                : 200;
            
            res.status(statusCode).json(result);
        } catch (error) {
            console.error('Controller error:', error);
            res.status(500).json({
                status: "ERROR",
                message: "Internal Server Error",
                timestamp: new Date().toISOString()
            });
        }
    }
}

module.exports = new NidVerificationController();