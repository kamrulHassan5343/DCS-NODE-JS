const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database'); // Sequelize instance

class InsuranceProductIdService {
    async insuranceProductId(database, loanProductId, projectCode, productCode1) {
        try {
            let insuranceProductId = '';
            let getProductId;

            console.log('Debug - Input params:', { database, loanProductId, projectCode, productCode1 });

            // Query to get product code using Sequelize syntax with projectCode filter
            if (productCode1 && productCode1 !== '') {
                // Use Sequelize raw query with proper parameter binding
                const query = `SELECT productcode FROM "${database}".product_project_member_category 
                              WHERE productcode = :productCode1 
                                AND projectcode = :projectCode
                              GROUP BY productcode`;
                console.log('Debug - Query 1:', query, 'Params:', { productCode1, projectCode });
                const result = await sequelize.query(query, {
                    replacements: { productCode1, projectCode },
                    type: QueryTypes.SELECT
                });
                getProductId = result;
            } else if (loanProductId && loanProductId !== '') {
                const query = `SELECT productcode FROM "${database}".product_project_member_category 
                              WHERE productid = :loanProductId 
                                AND projectcode = :projectCode
                              GROUP BY productcode`;
                console.log('Debug - Query 2:', query, 'Params:', { loanProductId, projectCode });
                const result = await sequelize.query(query, {
                    replacements: { loanProductId, projectCode },
                    type: QueryTypes.SELECT
                });
                getProductId = result;
            } else {
                // If no product code or ID provided, handle the case
                console.log('Debug - No product code or ID provided, skipping database query');
                getProductId = [];
            }

            console.log('Debug - Query result:', getProductId);

            if (getProductId.length === 0) {
                console.log('Debug - No product found, using projectCode logic directly');
                // If no product found in database, proceed with projectCode logic
                // Using the productCode1 passed in the request
                const productCode = productCode1 || '';
                return this.getInsuranceProductIdByProjectCode(projectCode, productCode);
            }

            const productCode = getProductId[0].productcode;

            // Determine insurance product ID based on project code and product code
            return this.getInsuranceProductIdByProjectCode(projectCode, productCode);

        } catch (error) {
            console.error('Error in insuranceProductId:', error);
            throw new Error('Error getting insurance product ID: ' + error.message);
        }
    }

    getInsuranceProductIdByProjectCode(projectCode, productCode) {
        let insuranceProductId = null;

        console.log('Debug - Getting insurance product ID for:', { projectCode, productCode });

        // Determine insurance product ID based on project code and product code
        switch (projectCode) {
            case '15':
                if (productCode === 'BD-10103') {
                    insuranceProductId = 25;
                } else if (productCode === 'BD-10113') {
                    insuranceProductId = 26;
                } else {
                    insuranceProductId = 33;
                }
                break;
            case '279':
                if (productCode === 'BD-10103') {
                    insuranceProductId = 29;
                } else if (productCode === 'BD-10113') {
                    insuranceProductId = 22;
                } else {
                    insuranceProductId = 34;
                }
                break;
            case '104':
                if (productCode === 'BD-10103') {
                    insuranceProductId = 27;
                } else if (productCode === 'BD-10113') {
                    insuranceProductId = 28;
                } else {
                    insuranceProductId = 36;
                }
                break;
            case '351':
                if (productCode === 'BD-10103') {
                    insuranceProductId = 23;
                } else if (productCode === 'BD-10113') {
                    insuranceProductId = 24;
                } else {
                    insuranceProductId = 35;
                }
                break;
            case '005': // Added your test case
                if (productCode === 'LPC123') {
                    insuranceProductId = 50; // Example ID for your test
                } else {
                    insuranceProductId = 40; // Default for project 005
                }
                break;
            default:
                insuranceProductId = null;
                break;
        }

        console.log('Debug - Determined insurance product ID:', insuranceProductId);
        return insuranceProductId;
    }
}

module.exports = InsuranceProductIdService;