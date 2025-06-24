const axios = require('axios');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');
const TokenCheckService = require('../services/TokenCheckService');
const ServerURLService = require('../services/ServerURLService');

class DcsInstallmentCalculatorController {
    async calculate(req, res) {
        // Validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.json({ 
                status: "E", 
                message: errors.array().map(e => e.msg).join('\n') 
            });
        }

        try {
            logger.info("InstallMent Calculator-", JSON.stringify(req.body));

            // Get server URLs
            const serverurl = await ServerURLService.server_url();
            if (typeof serverurl === 'string') {
                return res.json({ status: "CUSTMSG", message: serverurl });
            }

            const [, url2] = serverurl;
            if (!url2) {
                return res.json({ status: "CUSTMSG", message: "Api Url Not Found" });
            }

            // Get token
            const servertoken = await TokenCheckService.check_token();
            if (!servertoken) {
                return res.json({ status: "CUSTMSG", message: "Token Not Found" });
            }

            // Make API call
            const response = await axios.post(
                `${url2}loan/installment-calculator`,
                req.body,
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${servertoken}`
                    },
                    timeout: 30000
                }
            );

            const { status, data } = response;
            logger.info(`Instalment${status}/${JSON.stringify(data)}`);

            // Success response
            const responseData = {
                status,
                projectCode: data.projectCode || '',
                loanProductCode: data.loanProductCode || '',
                noOfInstallment: data.noOfInstallment || '',
                proposalDurationInMonths: data.proposalDurationInMonths || '',
                proposedLoanAmount: data.proposedLoanAmount || 0,
                frequencyId: data.frequencyId || 0,
                loanInstallment: data.loanInstallment || 0
            };

            logger.info("InstallMent Calculator server Message-", JSON.stringify(responseData));
            return res.json(responseData);

        } catch (error) {
            logger.error("InstallMent Calculator Error:", error.message);

            if (error.response) {
                const { status, data } = error.response;
                
                // Return error response with same structure
                return res.json({
                    status,
                    projectCode: '',
                    loanProductCode: '',
                    noOfInstallment: '',
                    proposalDurationInMonths: '',
                    proposedLoanAmount: 0,
                    frequencyId: 0,
                    loanInstallment: 0,
                    error: data.message || 'API Error'
                });
            }

            return res.json({ status: "E", message: error.message });
        }
    }

    static getValidationRules() {
        return [
            body('projectCode').optional().isString().isLength({ max: 3 }),
            body('loanProductCode').optional().isString().isLength({ max: 255 }),
            body('noOfInstallment').optional().isInt(),
            body('proposalDurationInMonths').optional().isInt(),
            body('proposedLoanAmount').optional().isInt(),
            body('frequencyId').optional().isInt()
        ];
    }
}

module.exports = DcsInstallmentCalculatorController;