const axios = require('axios');
const qs = require('querystring');
const Joi = require('joi');

class DcsInsurancePremiumCalculationService {
    constructor() {
        this.baseUrl = 'https://bracapitesting.brac.net';
        this.clientId = 'Ieg1N5W2qh3hF0qS9Zh2wq6eex2DB935';
        this.clientSecret = '4H2QJ89kYQBStaCuY73h';
        this.debugMode = true;
    }

    logDebug(message, data) {
        if (this.debugMode) {
            console.log(`[DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : '');
        }
    }

    validateRequest(data) {
        const schema = Joi.object({
            projectCode: Joi.string().max(10).required(),
            loanProductCode: Joi.string().max(50).required(),
            policyType: Joi.string().valid('A1', 'A2', 'B1', 'B2').required(),
            proposalDurationInMonths: Joi.number().integer().min(1).max(120).required(),
            proposedLoanAmount: Joi.number().min(1000).required(),
            insuranceProductId: Joi.number().integer().min(1).required(),
            memberDob: Joi.string().isoDate().required(),
            insurerDob: Joi.string().isoDate().required(),
            branchCode: Joi.string().max(10).required()
        });

        return schema.validate(data);
    }

    async getToken() {
        try {
            const response = await axios.post(`${this.baseUrl}/oauth/token`, qs.stringify({
                grant_type: 'client_credentials',
                client_id: this.clientId,
                client_secret: this.clientSecret
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                },
                timeout: 5000
            });

            if (!response.data.access_token) {
                throw new Error('Token missing in response');
            }

            return response.data.access_token;
        } catch (error) {
            this.logDebug('Token acquisition failed', {
                message: error.message,
                response: error.response?.data
            });
            throw new Error('Token acquisition failed');
        }
    }

    async calculate(requestData) {
        try {
            const { error } = this.validateRequest(requestData);
            if (error) return { status: 'E', message: error.details[0].message };

            const token = await this.getToken();
            const payload = {
                branchCode: requestData.branchCode,
                projectCode: requestData.projectCode,
                loanProductCode: requestData.loanProductCode,
                policyType: requestData.policyType,
                proposalDurationInMonths: requestData.proposalDurationInMonths,
                proposedLoanAmount: requestData.proposedLoanAmount,
                insuranceProductId: requestData.insuranceProductId,
                memberDateOfBirth: requestData.memberDob,
                insurerDateOfBirth: requestData.insurerDob
            };

            const response = await axios.post(
                `${this.baseUrl}/dcs/v2/loan/insurance-premium-calculator`,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    timeout: 10000
                }
            );

            return {
                status: 'S',
                ...response.data,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            this.logDebug('Calculation failed', {
                message: error.message,
                response: error.response?.data
            });

            return {
                status: 'E',
                message: error.message,
                details: error.response?.data,
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = DcsInsurancePremiumCalculationService;