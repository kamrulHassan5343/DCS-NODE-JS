const catchAsync = require("../utils/catchAsync");
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');
const zlib = require('zlib');
const { promisify } = require('util');

const db = require("../config/config");
const gzip = promisify(zlib.gzip);

class DcsDataSyncController {
    constructor() {
        this.dbName = 'dcs';
        
        // Column mappings for different tables
        this.columnMappings = {
            'bank_info': { branchcode: 'branchcode', assignedpo: 'assignedpo' },
            'polist': { branchcode: 'branchcode', projectcode: 'projectcode' },
            'loans': { branchcode: 'branchcode', projectcode: 'projectcode' },
            'surveys': { branchcode: 'branchcode', projectcode: 'projectcode', assignedpo: 'assignedpo' },
            'erp_member_info': { BranchCode: 'BranchCode', ProjectCode: 'ProjectCode' },
            'admissions': { branchcode: 'branchcode', projectcode: 'projectcode', assignedpo: 'assignedpo' },
            'device_token': { branchcode: 'branchcode', projectcode: 'projectcode', cono: 'cono' }
        };
    }

    getColumnName(tableName, logicalName) {
        const mapping = this.columnMappings[tableName];
        return mapping?.[logicalName] || logicalName;
    }

    castParameter(value, expectedType = 'string') {
        if (value === null || value === undefined) return null;
        return expectedType === 'integer' ? parseInt(value) || 0 : String(value);
    }

    static getValidationRules() {
        return [
            body('branchCode').optional().isString().isLength({ max: 4 }),
            body('projectCode').optional().isString().isLength({ max: 3 }),
            body('assignedpo').optional().isString(),
            body('pin').optional().isString()
        ];
    }

    async compressJsonData(data) {
        try {
            const jsonString = JSON.stringify(data);
            const compressedBuffer = await gzip(jsonString);
            const compressionRatio = ((jsonString.length - compressedBuffer.length) / jsonString.length * 100).toFixed(2);
            
            logger.info(`Compression: ${jsonString.length} → ${compressedBuffer.length} bytes (${compressionRatio}% saved)`);
            
            return { buffer: compressedBuffer, compressionRatio };
        } catch (error) {
            logger.error('Compression error:', error);
            throw error;
        }
    }

    async updateDeviceToken(branchCode, projectCode, cono, token) {
        try {
            const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
            const branchCodeCol = this.getColumnName('device_token', 'branchcode');
            const projectCodeCol = this.getColumnName('device_token', 'projectcode');
            const conoCol = this.getColumnName('device_token', 'cono');
            
            const checkQuery = `SELECT * FROM ${this.dbName}.device_token WHERE ${branchCodeCol} = $1 AND ${projectCodeCol} = $2 AND ${conoCol} = $3`;
            const existing = await db.query(checkQuery, [branchCode, projectCode, cono]);

            if (existing.length > 0) {
                const updateQuery = `UPDATE ${this.dbName}.device_token SET token = $1, updated_at = $2::timestamp WHERE ${branchCodeCol} = $3 AND ${projectCodeCol} = $4 AND ${conoCol} = $5`;
                await db.query(updateQuery, [token, currentTime, branchCode, projectCode, cono]);
            } else {
                const insertQuery = `INSERT INTO ${this.dbName}.device_token (${branchCodeCol}, ${projectCodeCol}, ${conoCol}, token, created_at) VALUES ($1, $2, $3, $4, $5::timestamp)`;
                await db.query(insertQuery, [branchCode, projectCode, cono, token, currentTime]);
            }
        } catch (error) {
            logger.error('Device Token Error:', error);
        }
    }

    async dcsDataSync(req, res) {
        try {
            logger.info('DCS Data Sync Started');
            
            const useCompression = req.query.compress !== 'false';
            
            // Test mode for quick testing
            if (req.query.test === 'true') {
                const testResponse = { status: "success", message: "Test response", timestamp: new Date().toISOString() };
                
                if (useCompression) {
                    const compressed = await this.compressJsonData(testResponse);
                    res.setHeader('Content-Type', 'application/json');
                    res.setHeader('Content-Encoding', 'gzip');
                    return res.send(compressed.buffer);
                }
                return res.json(testResponse);
            }

            // Validation
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.json({ status: "E", message: errors.array().map(e => e.msg).join(', ') });
            }

            // Extract parameters
            const { branchCode, projectCode, assignedpo, pin, token: deviceToken = '' } = req.body;
            const apiToken = req.headers['apikey'] || req.headers['apiKey'];
            const appId = req.headers['appid'] || req.headers['appId'];
            const appVersionCode = parseInt(req.headers['appversioncode'] || req.headers['appVersionCode']) || 0;

            // Basic validation
            if (!branchCode || !projectCode || !pin) {
                return res.json({ status: "E", message: "Missing required parameters: branchCode, projectCode, or pin" });
            }
            if (!apiToken) return res.json({ status: "E", message: "API Key is required" });
            if (!appId) return res.json({ status: "E", message: "App ID is required" });

            // Version check
            if ((appId === 'bmsmerp' && appVersionCode < 119) || (appId !== 'bmsmerp' && appVersionCode < 45)) {
                return res.json({ status: "E", message: "Please update to the latest version" });
            }

            // Project code validation
            if (!['015', '279', '351', '104'].includes(projectCode)) {
                return res.json({ status: "E", message: "Invalid project code" });
            }

            // Handle device token
            if (deviceToken) {
                await this.updateDeviceToken(branchCode, projectCode, pin, deviceToken);
            }

            // Table mappings
            const tableMappings = {
                BankList: 'bank_info',
                polist: 'polist',
                loans: 'loans',
                surveydata: 'surveys',
                erpmemberlist: 'erp_member_info',
                admissions: 'admissions'
            };

            const dataSetArray = {};

            // Fetch data from all tables
            for (const [key, tableName] of Object.entries(tableMappings)) {
                try {
                    let query = '';
                    const params = [];

                    if (tableName === 'bank_info') {
                        query = `SELECT * FROM ${this.dbName}.${tableName} WHERE branchcode = $1`;
                        params.push(branchCode);
                        if (assignedpo) {
                            query += ` AND assignedpo = $2`;
                            params.push(assignedpo);
                        }
                    } else if (tableName === 'erp_member_info') {
                        query = `SELECT * FROM ${this.dbName}.${tableName} WHERE "BranchCode" = $1 AND "ProjectCode" = $2`;
                        params.push(branchCode, projectCode);
                    } else {
                        // For polist, loans, surveys, admissions
                        query = `SELECT * FROM ${this.dbName}.${tableName} WHERE branchcode = $1 AND projectcode = $2`;
                        params.push(branchCode, projectCode);
                        
                        if ((tableName === 'surveys' || tableName === 'admissions') && assignedpo) {
                            query += ` AND assignedpo = $3`;
                            params.push(assignedpo);
                        }
                    }

                    const result = await db.query(query, params);
                    dataSetArray[key] = result || [];
                    logger.info(`${key}: ${result?.length || 0} records`);
                } catch (err) {
                    logger.error(`Error fetching ${key}:`, err.message);
                    dataSetArray[key] = [];
                }
            }

            // Prepare response
            const responseData = {
                status: "success",
                time: new Date().toISOString().slice(0, 19).replace('T', ' '),
                message: "Data synchronized successfully",
                data: dataSetArray
            };

            // Apply compression if requested
            if (useCompression) {
                const compressed = await this.compressJsonData(responseData);
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Encoding', 'gzip');
                res.setHeader('X-Compression-Ratio', compressed.compressionRatio + '%');
                return res.send(compressed.buffer);
            }

            return res.json(responseData);

        } catch (error) {
            logger.error('DCS Data Sync Error:', error);
            
            if (!res.headersSent) {
                return res.json({
                    status: "E",
                    message: "Internal server error: " + error.message
                });
            }
        }
    }
}

// Create controller instance
const dcsDataSyncController = new DcsDataSyncController();

// Export functions
exports.dcsDataSync = catchAsync(async (req, res) => {
    return await dcsDataSyncController.dcsDataSync(req, res);
});

exports.validationRules = DcsDataSyncController.getValidationRules();