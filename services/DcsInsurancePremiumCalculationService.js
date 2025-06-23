const axios = require('axios');
const qs = require('querystring');
const Joi = require('joi');

class DcsInsurancePremiumCalculationService {
    constructor() {
        this.baseUrl = 'https://bracapitesting.brac.net';
        this.clientId = 'Ieg1N5W2qh3hF0qS9Zh2wq6eex2DB935';
        this.clientSecret = '4H2QJ89kYQBStaCuY73h';
        this.token = null;
        this.tokenExpiry = null;
        
        // Enable detailed debugging
        this.debugMode = true;
    }

    logDebug(message, data = null) {
        if (this.debugMode) {
            console.log(`[DEBUG] ${message}`);
            if (data) {
                console.log(JSON.stringify(data, null, 2));
            }
        }
    }

    validateRequest = (data) => {
        this.logDebug('Validating request data:', data);
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

        const result = schema.validate(data);
        this.logDebug('Validation result:', result);
        return result;
    }

    async getToken() {
        this.logDebug('Attempting to get token');
        this.logDebug('Using credentials:', {
            clientId: this.clientId,
            clientSecret: this.clientSecret ? `${this.clientSecret.substring(0, 3)}...` : 'undefined'
        });

        try {
            const tokenUrl = `${this.baseUrl}/oauth/token`;
            this.logDebug('Token endpoint:', tokenUrl);

            const requestData = qs.stringify({
                grant_type: 'client_credentials',
                client_id: this.clientId,
                client_secret: this.clientSecret
            });

            this.logDebug('Token request payload:', {
                grant_type: 'client_credentials',
                client_id: this.clientId,
                client_secret: this.clientSecret ? '***redacted***' : 'undefined'
            });

            const config = {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                },
                timeout: 5000
            };

            this.logDebug('Request config:', config);

            const response = await axios.post(tokenUrl, requestData, config);
            this.logDebug('Token response:', {
                status: response.status,
                data: response.data
            });

            if (!response.data.access_token) {
                throw new Error('Token missing in response');
            }

            return response.data.access_token;

        } catch (error) {
            let errorDetails = {
                message: error.message,
                stack: error.stack
            };

            if (error.response) {
                errorDetails.response = {
                    status: error.response.status,
                    headers: error.response.headers,
                    data: error.response.data
                };
            } else if (error.request) {
                errorDetails.request = {
                    method: error.config.method,
                    url: error.config.url,
                    headers: error.config.headers,
                    data: error.config.data
                };
            }

            this.logDebug('Token acquisition failed:', errorDetails);
            throw new Error(`Token acquisition failed: ${JSON.stringify(errorDetails)}`);
        }
    }

    async calculate(requestData) {
        try {
            this.logDebug('Starting calculation with request data:', requestData);

            // Validate input
            const validationResult = this.validateRequest(requestData);
            if (validationResult.error) {
                return {
                    status: 'E',
                    message: validationResult.error.details[0].message,
                    validationError: true
                };
            }

            // Get token
            const token = await this.getToken();
            this.logDebug('Obtained token:', token ? `${token.substring(0, 10)}...` : 'null');

            // Prepare payload
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

            this.logDebug('Prepared API payload:', payload);

            // Make API call
            const apiUrl = `${this.baseUrl}/dcs/v2/loan/insurance-premium-calculator`;
            this.logDebug('Making request to:', apiUrl);

            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                timeout: 10000
            };

            this.logDebug('API request config:', config);

            const response = await axios.post(apiUrl, payload, config);
            this.logDebug('API response:', {
                status: response.status,
                data: response.data
            });

            return {
                status: 'S',
                ...response.data,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            let errorDetails = {
                message: error.message,
                stack: error.stack
            };

            if (error.response) {
                errorDetails.response = {
                    status: error.response.status,
                    headers: error.response.headers,
                    data: error.response.data
                };
            } else if (error.request) {
                errorDetails.request = {
                    method: error.config.method,
                    url: error.config.url,
                    headers: error.config.headers,
                    data: error.config.data
                };
            }

            this.logDebug('Calculation failed:', errorDetails);

            return {
                status: 'E',
                message: error.message,
                details: errorDetails,
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = DcsInsurancePremiumCalculationService;
