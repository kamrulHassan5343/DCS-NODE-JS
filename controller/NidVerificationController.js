const LiveApiNidVerificationService = require('../services/LiveApiNidVerificationService');
const { validationResult } = require('express-validator');

class NidVerificationController {
    constructor() {
        this.nidVerificationService = new LiveApiNidVerificationService();
        // Bind the method to preserve 'this' context
        this.verifyNid = this.verifyNid.bind(this);
    }

    async verifyNid(req, res) {
        try {
            // Validate request using express-validator
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    status: "E",
                    message: errors.array().map(error => error.msg).join("\n")
                });
            }

            // Process verification using the service
            const result = await this.nidVerificationService.nidVerify(req);
            
            // Determine response status code based on result
            let statusCode;
            if (result.status === "ERROR" || result.status === "E") {
                statusCode = result.code ? parseInt(result.code) : 500;
            } else {
                statusCode = 200;
            }
            
            // Send response
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

    // Alternative static method approach (similar to SavingsTransactionService)
    static async verifyNidStatic(req, res) {
        try {
            // Validate request using express-validator
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    status: "E",
                    message: errors.array().map(error => error.msg).join("\n")
                });
            }

            // Use static execute method
            const result = await LiveApiNidVerificationService.execute(req);
            
            // Determine response status code
            let statusCode;
            if (result.status === "ERROR" || result.status === "E") {
                statusCode = result.code ? parseInt(result.code) : 500;
            } else {
                statusCode = 200;
            }
            
            // Send response
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

// Export an instance of the controller
module.exports = new NidVerificationController();