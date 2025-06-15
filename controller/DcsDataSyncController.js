const catchAsync = require("../utils/catchAsync");
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

// Replace this with your actual DB connection
const db = require("../config/config");

class MockService {
    static async message(msg) {
        return { status: 'E', message: msg };
    }
}

class DcsDataSyncController {
    constructor() {
        this.dbName = 'dcs';
        
        // Updated column mappings based on actual schema
        this.columnMappings = {
            'bank_info': {
                branchcode: 'branchcode',
                assignedpo: 'assignedpo'
            },
            'polist': {
                branchcode: 'branchcode',
                projectcode: 'projectcode',
                updated_at: null
            },
            'loans': {
                branchcode: 'branchcode',
                projectcode: 'projectcode',
            },
            'surveys': {
                branchcode: 'branchcode',
                projectcode: 'projectcode',
                assignedpo: 'assignedpo'
            },
            'erp_member_info': {
                BranchCode: 'BranchCode',
                ProjectCode: 'ProjectCode',
            },
            'admissions': {
                branchcode: 'branchcode',
                projectcode: 'projectcode',
                assignedpo: 'assignedpo'
            },
            'device_token': {
                branchcode: 'branchcode',
                projectcode: 'projectcode',
                cono: 'cono'
            }
        };
    }

    static getValidationRules() {
        return [
            body('branchCode').optional().isString().isLength({ max: 4 }),
            body('projectCode').optional().isString().isLength({ max: 3 }),
            body('assignedpo').optional().isString(),
            body('BranchCode').optional().isString().isLength({ max: 4 }),
            body('ProjectCode').optional().isString().isLength({ max: 3 }),
            body('lastSyncTime').optional(),
            body('currentTime').optional(),
            body('pin').optional().isString(),
            body('appVersionName').optional().isString()
        ];
    }

    // Helper method to get the correct column name
    getColumnName(tableName, logicalName) {
        const mapping = this.columnMappings[tableName];
        return mapping && mapping[logicalName] ? mapping[logicalName] : logicalName;
    }

    // Helper method to cast parameters to appropriate types
    castParameter(value, expectedType = 'string') {
        if (value === null || value === undefined) return null;
        
        switch (expectedType) {
            case 'integer':
                return parseInt(value) || 0;
            case 'string':
            default:
                return String(value);
        }
    }

    async dcsDataSync(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.json({ status: "E", message: errors.array().map(e => e.msg).join('\n') });
            }

            const {
                branchCode,
                BranchCode,
                projectCode,
                ProjectCode,
                assignedpo,
                pin,
                lastSyncTime: inputLastSyncTime,
                token: deviceToken = ''
            } = req.body;

            const token = req.headers['apikey'] || req.headers['apiKey'];
            const appId = req.headers['appid'] || req.headers['appId'];
            const appVersionCode = parseInt(req.headers['appversioncode'] || req.headers['appVersionCode']) || 0;
            let lastSyncTime = inputLastSyncTime;
            const currentTimes = new Date().toISOString().slice(0, 19).replace('T', ' ');

            logger.info(`Params - ${token}/${branchCode}/${appId}/${pin}/${lastSyncTime}/${projectCode}/${appVersionCode}`);

            if (!branchCode || !projectCode || !pin) {
                return res.json({ status: "E", message: "Missing required parameters: branchCode, projectCode, or pin" });
            }

            if (lastSyncTime === "2000-01-01 00:00:00") {
                const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
                lastSyncTime = sixtyDaysAgo.toISOString().slice(0, 19).replace('T', ' ');
            }

            // Version check
            if ((appId === 'bmsmerp' && appVersionCode < 119) || (appId !== 'bmsmerp' && appVersionCode < 45)) {
                return res.json(await MockService.message("দূঃখিত আপনি পুরাতন ভার্সন ব্যবহার করতেছেন।অনুগ্রহ করে নতুন ভার্সন ডাউনলোড করে নেন।"));
            }

            if (projectCode === '060') {
                return res.json({ status: "E", message: "Project 060 requires special controller - not implemented yet" });
            } else if (!['015', '279', '351', '104'].includes(projectCode)) {
                return res.json(await MockService.message("Project Code Not Found!"));
            }

            if (deviceToken !== '') {
                logger.info(`Device Token - ${deviceToken}`);
                await this.deviceTokenNotification(branchCode, projectCode, pin, deviceToken);
            }

            // Fixed table mappings - use correct table names
            const tableMappings = {
                Configurationdata: 'celing_configs',
                BankList: 'bank_info',
                polist: 'polist',
                loans: 'loans',
                surveydata: 'surveys',
                erpmemberlist: 'erp_member_info',
                admissions: 'admissions'
            };

            // Initialize validation
            if (!branchCode || !projectCode) {
                return res.json({ status: "E", message: "Branch Code and Project Code are required" });
            }
            if (!lastSyncTime) {
                lastSyncTime = '2000-01-01 00:00:00';
            }
            if (!token) {
                return res.json({ status: "E", message: "API Key is required" });
            }
            if (!appId) {
                return res.json({ status: "E", message: "App ID is required" });
            }
            if (!appVersionCode) {
                return res.json({ status: "E", message: "App Version Code is required" });
            }

            const dataSetArray = {};

            for (const [key, tableName] of Object.entries(tableMappings)) {
                try {
                    // Get proper column names
                    const branchCodeCol = this.getColumnName(tableName, 'branchcode');
                    const projectCodeCol = this.getColumnName(tableName, 'projectcode');
                    const BranchCodeCol = this.getColumnName(tableName, 'BranchCode');
                    const ProjectCodeCol = this.getColumnName(tableName, 'ProjectCode');
                    const assignPoPinCol = this.getColumnName(tableName, 'assign_po_pin');
                    const assignedpoCol = this.getColumnName(tableName, 'assignedpo');
                    const updatedAtCol = this.getColumnName(tableName, 'updated_at');

                    // Build query based on table structure
                    let query = '';
                    const params = [];
                    let paramIndex = 1;

                    if (tableName === 'bank_info') {
                        query = `SELECT * FROM ${this.dbName}.${tableName} WHERE ${branchCodeCol} = $${paramIndex}`;
                        params.push(this.castParameter(branchCode, 'string'));
                        paramIndex++;

                        if (assignedpoCol && assignedpo) {
                            query += ` AND ${assignedpoCol} = $${paramIndex}`;
                            params.push(this.castParameter(assignedpo, 'string'));
                            paramIndex++;
                        }
                    } else if (tableName === 'polist') {
                        query = `SELECT * FROM ${this.dbName}.${tableName} WHERE ${branchCodeCol} = $${paramIndex} AND ${projectCodeCol} = $${paramIndex + 1}`;
                        params.push(this.castParameter(branchCode, 'string'));
                        params.push(this.castParameter(projectCode, 'string'));
                        paramIndex += 2;
                    } else if (tableName === 'loans') {
                        query = `SELECT * FROM ${this.dbName}.${tableName} WHERE ${branchCodeCol} = $${paramIndex} AND ${projectCodeCol} = $${paramIndex + 1}`;
                        params.push(this.castParameter(branchCode, 'string'));
                        params.push(this.castParameter(projectCode, 'string'));
                        paramIndex += 2;
                    } else if (tableName === 'surveys') {
                        query = `SELECT * FROM ${this.dbName}.${tableName} WHERE ${branchCodeCol} = $${paramIndex} AND ${projectCodeCol} = $${paramIndex + 1}`;
                        params.push(this.castParameter(branchCode, 'string'));
                        params.push(this.castParameter(projectCode, 'string'));
                        paramIndex += 2;
                        
                        if (assignedpo !== null && assignedpo !== undefined) {
                            query += ` AND ${assignedpoCol} = $${paramIndex}`;
                            params.push(this.castParameter(assignedpo, 'string'));
                            paramIndex++;
                        }
                    } else if (tableName === 'erp_member_info') {
                        // FIXED: Use double quotes for case-sensitive column names in PostgreSQL
                        // query = `SELECT * FROM ${this.dbName}.${tableName} WHERE "${BranchCodeCol}" = ${paramIndex} AND "${ProjectCodeCol}" = ${paramIndex + 1}`;
                        // params.push(this.castParameter(branchCode, 'string')); // Fixed: use branchCode
                        // params.push(this.castParameter(projectCode, 'string')); // Fixed: use projectCode



                        query = `SELECT * FROM ${this.dbName}.${tableName} WHERE "${BranchCodeCol}" = $1 AND "${ProjectCodeCol}" = $2`;
params.push(this.castParameter(branchCode, 'string'));
params.push(this.castParameter(projectCode, 'string'));
                        paramIndex += 2;
                    } else if (tableName === 'admissions') {
                        query = `SELECT * FROM ${this.dbName}.${tableName} WHERE ${branchCodeCol} = $${paramIndex} AND ${projectCodeCol} = $${paramIndex + 1}`;
                        params.push(this.castParameter(branchCode, 'string'));
                        params.push(this.castParameter(projectCode, 'string'));
                        paramIndex += 2;
                        
                        if (assignedpo !== null && assignedpo !== undefined) {
                            query += ` AND ${assignedpoCol} = $${paramIndex}`;
                            params.push(this.castParameter(assignedpo, 'string'));
                            paramIndex++;
                        }
                    }

                    logger.info(`Query: ${query}, Params: ${JSON.stringify(params)}`);
                    const result = await db.query(query, params);
                    dataSetArray[key] = result || [];
                } catch (err) {
                    logger.warn(`Error fetching ${key}: ${err.message}`);
                    dataSetArray[key] = [];
                }
            }

            return res.json({
                status: "success",
                time: currentTimes,
                message: "Data synchronized successfully",
                data: dataSetArray
            });

        } catch (error) {
            logger.error('DCS Data Sync Error:', error);
            return res.json(await MockService.message(error.message));
        }
    }

    // FIXED: Removed duplicate parameters
    async deviceTokenNotification(branchCode, projectCode, cono, token) {
        try {
            const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
            
            // Check if device_token table exists first
            const tableExistsQuery = `
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'dcs' AND table_name = 'device_token'
                );
            `;
            
            const tableExists = await db.query(tableExistsQuery);
            
            if (!tableExists[0]?.exists) {
                logger.warn('device_token table does not exist. Skipping device token notification.');
                return;
            }
            
            // Get proper column names
            const branchCodeCol = this.getColumnName('device_token', 'branchcode');
            const projectCodeCol = this.getColumnName('device_token', 'projectcode');
            const conoCol = this.getColumnName('device_token', 'cono');
            
            const checkQuery = `SELECT * FROM ${this.dbName}.device_token WHERE ${branchCodeCol} = $1 AND ${projectCodeCol} = $2 AND ${conoCol} = $3`;
            const existing = await db.query(checkQuery, [
                this.castParameter(branchCode, 'string'),
                this.castParameter(projectCode, 'string'),
                this.castParameter(cono, 'string')
            ]);

            if (existing.length > 0) {
                const updateQuery = `
                    UPDATE ${this.dbName}.device_token 
                    SET token = $1, updated_at = $2::timestamp 
                    WHERE ${branchCodeCol} = $3 AND ${projectCodeCol} = $4 AND ${conoCol} = $5
                `;
                await db.query(updateQuery, [
                    token,
                    currentTime,
                    this.castParameter(branchCode, 'string'),
                    this.castParameter(projectCode, 'string'),
                    this.castParameter(cono, 'string')
                ]);
            } else {
                const insertQuery = `
                    INSERT INTO ${this.dbName}.device_token (${branchCodeCol}, ${projectCodeCol}, ${conoCol}, token, created_at) 
                    VALUES ($1, $2, $3, $4, $5::timestamp)
                `;
                await db.query(insertQuery, [
                    this.castParameter(branchCode, 'string'),
                    this.castParameter(projectCode, 'string'),
                    this.castParameter(cono, 'string'),
                    token,
                    currentTime
                ]);
            }
        } catch (error) {
            logger.error('Device Token Notification Error:', error);
        }
    }
}

// Fixed schema check function
async function checkTableSchema() {
    try {
        const tables = ['celing_configs', 'bank_info', 'polist','loans', 'surveys', 'admissions','erp_member_info'];
        
        for (const table of tables) {
            console.log(`\n=== Schema for ${table} ===`);
            console.log('Connected to PostgreSQL database');
            try {
                const schemaQuery = `
                    SELECT column_name, data_type, is_nullable 
                    FROM information_schema.columns 
                    WHERE table_schema = 'dcs' AND table_name = '${table}'
                    ORDER BY ordinal_position;
                `;
                
                console.log('Executed query', {
                    text: schemaQuery,
                    duration: 0,
                    rows: 0
                });
                
                const schema = await db.query(schemaQuery);
                console.table(schema);
                
                // Check if table has any data
                const countQuery = `SELECT COUNT(*) as count FROM dcs.${table}`;
                console.log('Executed query', {
                    text: countQuery,
                    duration: 0,
                    rows: 1
                });
                
                const count = await db.query(countQuery);
                console.log(`Row count: ${count[0]?.count || 0}`);
                
                // Show sample data if exists
                if (count[0]?.count > 0) {
                    const sampleQuery = `SELECT * FROM dcs.${table} LIMIT 3`;
                    console.log('Executed query', {
                        text: sampleQuery,
                        duration: 0,
                        rows: Math.min(3, count[0]?.count || 0)
                    });
                    
                    const sample = await db.query(sampleQuery);
                    console.log("Sample data:");
                    console.table(sample);
                }
            } catch (err) {
                console.log(`Error checking ${table}: ${err.message}`);
            }
        }
    } catch (error) {
        console.error('Schema check error:', error);
    }
}

// Create controller instance
const dcsDataSyncController = new DcsDataSyncController();

// Export the main functions
exports.dcsDataSync = catchAsync(async (req, res) => {
    return await dcsDataSyncController.dcsDataSync(req, res);
});

exports.validationRules = DcsDataSyncController.getValidationRules();
exports.DcsDataSyncController = DcsDataSyncController;
exports.checkTableSchema = checkTableSchema;