const catchAsync = require("../utils/catchAsync");
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');
const zlib = require('zlib'); // Built-in Node.js compression
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

// Replace this with your actual DB connection
const db = require("../config/config");

// Promisify compression functions
const gzip = promisify(zlib.gzip);
const deflate = promisify(zlib.deflate);

class MockService {
    static async message(msg) {
        return { status: 'E', message: msg };
    }
}

class DcsDataSyncController {
    constructor() {
        this.dbName = 'dcs';
        this.cacheDir = path.join(__dirname, '../cache');
        this.zipDir = path.join(__dirname, '../zip_files');
        this.ensureDirectories();
        
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

    async ensureDirectories() {
        try {
            await fs.mkdir(this.cacheDir, { recursive: true });
            await fs.mkdir(this.zipDir, { recursive: true });
        } catch (error) {
            logger.error('Error creating directories:', error);
        }
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

    // Generate unique filename based on request parameters
    generateCacheKey(branchCode, projectCode, pin, lastSyncTime) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        return `${branchCode}_${projectCode}_${pin}_${timestamp}`;
    }

    // Save JSON data to file
    async saveJsonToFile(data, filename) {
        try {
            const jsonString = JSON.stringify(data, null, 2);
            const filePath = path.join(this.cacheDir, `${filename}.json`);
            await fs.writeFile(filePath, jsonString, 'utf8');
            logger.info(`JSON data saved to: ${filePath}`);
            return filePath;
        } catch (error) {
            logger.error('Error saving JSON file:', error);
            throw error;
        }
    }

    // Save compressed data to file
    async saveCompressedToFile(compressedBuffer, filename, extension = 'gz') {
        try {
            const filePath = path.join(this.zipDir, `${filename}.${extension}`);
            await fs.writeFile(filePath, compressedBuffer);
            logger.info(`Compressed data saved to: ${filePath}`);
            return filePath;
        } catch (error) {
            logger.error('Error saving compressed file:', error);
            throw error;
        }
    }

    // Load cached data if exists
    async loadCachedData(filename) {
        try {
            const filePath = path.join(this.cacheDir, `${filename}.json`);
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            logger.info(`No cached data found for: ${filename}`);
            return null;
        }
    }

    // Clean old cache files (optional)
    async cleanOldCache(maxAgeHours = 24) {
        try {
            const files = await fs.readdir(this.cacheDir);
            const now = Date.now();
            const maxAge = maxAgeHours * 60 * 60 * 1000;

            for (const file of files) {
                const filePath = path.join(this.cacheDir, file);
                const stats = await fs.stat(filePath);
                if (now - stats.mtime.getTime() > maxAge) {
                    await fs.unlink(filePath);
                    logger.info(`Cleaned old cache file: ${file}`);
                }
            }
        } catch (error) {
            logger.error('Error cleaning cache:', error);
        }
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

    async compressJsonData(data, compressionType = 'gzip') {
        try {
            const jsonString = JSON.stringify(data);
            const originalSize = Buffer.byteLength(jsonString, 'utf8');
            
            let compressedBuffer;
            let contentEncoding;
            
            switch (compressionType) {
                case 'gzip':
                    compressedBuffer = await gzip(jsonString);
                    contentEncoding = 'gzip';
                    break;
                case 'deflate':
                    compressedBuffer = await deflate(jsonString);
                    contentEncoding = 'deflate';
                    break;
                default:
                    throw new Error('Unsupported compression type');
            }
            
            const compressedSize = compressedBuffer.length;
            const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);
            
            logger.info(`Compression stats: Original: ${originalSize} bytes, Compressed: ${compressedSize} bytes, Ratio: ${compressionRatio}%`);
            
            return {
                buffer: compressedBuffer,
                contentEncoding,
                originalSize,
                compressedSize,
                compressionRatio
            };
        } catch (error) {
            logger.error('Compression error:', error);
            throw error;
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

    async dcsDataSync(req, res) {
        try {
            logger.info('=== DCS Data Sync Started ===');
            
            // MODIFIED: Set compression and file saving as default enabled
            // Allow explicit disable with compress=false or save=false
            const useCompression = req.query.compress !== 'false' && 
                                 (req.query.compress === 'true' || 
                                  req.headers['accept-encoding']?.includes('gzip') || 
                                  true); // Default to true
            
            const saveToFile = req.query.save !== 'false'; // Default to true, disable with save=false
            
            // Early response to test basic functionality
            const testMode = req.query.test === 'true';
            if (testMode) {
                logger.info('Test mode enabled - returning simple response');
                const testResponse = {
                    status: "success",
                    message: "Test response",
                    timestamp: new Date().toISOString(),
                    headers: req.headers,
                    body: req.body,
                    compression: useCompression ? 'enabled' : 'disabled',
                    fileStorage: saveToFile ? 'enabled' : 'disabled'
                };

                if (useCompression) {
                    const compressed = await this.compressJsonData(testResponse);
                    res.setHeader('Content-Type', 'application/json');
                    res.setHeader('Content-Encoding', compressed.contentEncoding);
                    res.setHeader('X-Original-Size', compressed.originalSize);
                    res.setHeader('X-Compressed-Size', compressed.compressedSize);
                    res.setHeader('X-Compression-Ratio', compressed.compressionRatio + '%');
                    return res.send(compressed.buffer);
                }
                
                return res.json(testResponse);
            }

            // Validation
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                logger.error('Validation errors:', errors.array());
                return res.json({ 
                    status: "E", 
                    message: errors.array().map(e => e.msg).join('\n') 
                });
            }

            // Extract parameters
            const {
                branchCode,
                BranchCode,
                projectCode,
                ProjectCode,
                assignedpo,
                pin,
                lastSyncTime: inputLastSyncTime = '2000-01-01 00:00:00',
                token: deviceToken = ''
            } = req.body;

            const token = req.headers['apikey'] || req.headers['apiKey'];
            const appId = req.headers['appid'] || req.headers['appId'];
            const appVersionCode = parseInt(req.headers['appversioncode'] || req.headers['appVersionCode']) || 0;
            let lastSyncTime = inputLastSyncTime;
            const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

            logger.info(`Request params: branchCode=${branchCode}, projectCode=${projectCode}, pin=${pin}`);
            logger.info(`Headers: token=${token}, appId=${appId}, appVersionCode=${appVersionCode}`);
            logger.info(`Options: compression=${useCompression}, saveToFile=${saveToFile}`);

            // Generate cache key for this request
            const cacheKey = this.generateCacheKey(branchCode, projectCode, pin, inputLastSyncTime);
            logger.info(`Cache key: ${cacheKey}`);

            // Basic validation
            if (!branchCode || !projectCode || !pin) {
                logger.error('Missing required parameters');
                return res.json({ 
                    status: "E", 
                    message: "Missing required parameters: branchCode, projectCode, or pin" 
                });
            }

            if (!token) {
                logger.error('Missing API key');
                return res.json({ status: "E", message: "API Key is required" });
            }

            if (!appId) {
                logger.error('Missing App ID');
                return res.json({ status: "E", message: "App ID is required" });
            }

            // Adjust lastSyncTime if default
            if (lastSyncTime === "2000-01-01 00:00:00") {
                const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
                lastSyncTime = sixtyDaysAgo.toISOString().slice(0, 19).replace('T', ' ');
            }

            // Version check
            if ((appId === 'bmsmerp' && appVersionCode < 119) || (appId !== 'bmsmerp' && appVersionCode < 45)) {
                logger.warn('Old version detected');
                return res.json(await MockService.message("দূঃখিত আপনি পুরাতন ভার্সন ব্যবহার করতেছেন।অনুগ্রহ করে নতুন ভার্সন ডাউনলোড করে নেন।"));
            }

            // Project code validation
            if (projectCode === '060') {
                return res.json({ status: "E", message: "Project 060 requires special controller - not implemented yet" });
            }
            
            if (!['015', '279', '351', '104'].includes(projectCode)) {
                logger.error('Invalid project code:', projectCode);
                return res.json(await MockService.message("Project Code Not Found!"));
            }

            // Handle device token notification
            if (deviceToken !== '') {
                logger.info(`Device Token - ${deviceToken}`);
                await this.deviceTokenNotification(branchCode, projectCode, pin, deviceToken);
            }

            logger.info('Basic validation passed, starting database queries...');

            // Check for cached data first (optional optimization)
            let cachedData = null;
            if (req.query.useCache === 'true') {
                cachedData = await this.loadCachedData(cacheKey);
                if (cachedData) {
                    logger.info('Using cached data');
                    cachedData.cached = true;
                    cachedData.cacheKey = cacheKey;
                    return res.json(cachedData);
                }
            }

            // Test database connection first
            try {
                logger.info('Testing database connection...');
                const testQuery = 'SELECT 1 as test';
                const testResult = await db.query(testQuery);
                logger.info('Database connection successful:', testResult);
            } catch (dbError) {
                logger.error('Database connection failed:', dbError);
                return res.json({ 
                    status: "E", 
                    message: "Database connection error: " + dbError.message 
                });
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

            const dataSetArray = {};

            // Fetch data from all tables
            for (const [key, tableName] of Object.entries(tableMappings)) {
                try {
                    logger.info(`Fetching data from ${tableName}...`);
                    
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

                    if (tableName === 'celing_configs') {
                        // Configuration data - usually doesn't need branch/project filtering
                        query = `SELECT * FROM ${this.dbName}.${tableName}`;
                        // No parameters needed for configuration data
                    } else if (tableName === 'bank_info') {
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

                    // Only execute query if it's not empty
                    if (query.trim()) {
                        logger.info(`Query: ${query}, Params: ${JSON.stringify(params)}`);
                        const result = await db.query(query, params);
                        dataSetArray[key] = result || [];
                        logger.info(`${key} data fetched: ${result ? result.length : 0} records`);
                    } else {
                        logger.warn(`Empty query for table ${tableName}, skipping...`);
                        dataSetArray[key] = [];
                    }
                } catch (err) {
                    logger.error(`Error fetching ${key}: ${err.message}`);
                    dataSetArray[key] = [];
                }
            }

            logger.info('Database queries completed, preparing response...');

            // Prepare response
            const responseData = {
                status: "success",
                time: currentTime,
                message: "Data synchronized successfully",
                compressed: useCompression,
                cacheKey: cacheKey,
                requestInfo: {
                    branchCode,
                    projectCode,
                    pin,
                    appId,
                    lastSyncTime: inputLastSyncTime
                },
                debug: {
                    totalTables: Object.keys(dataSetArray).length,
                    recordCounts: Object.fromEntries(
                        Object.entries(dataSetArray).map(([key, value]) => [key, value.length])
                    )
                },
                data: dataSetArray
            };

            logger.info('Response prepared, checking file storage and compression...');

            // Save to file if requested (now enabled by default)
            let savedFiles = {};
            if (saveToFile) {
                try {
                    // Save JSON file
                    const jsonPath = await this.saveJsonToFile(responseData, cacheKey);
                    savedFiles.jsonFile = jsonPath;
                    
                    // Clean old cache files
                    await this.cleanOldCache(24); // Clean files older than 24 hours
                } catch (saveError) {
                    logger.error('Error saving files:', saveError);
                }
            }

            // Apply compression if requested (now enabled by default)
            if (useCompression) {
                try {
                    logger.info('Compressing response data...');
                    const compressed = await this.compressJsonData(responseData);
                    
                    // Save compressed file if requested
                    if (saveToFile) {
                        const compressedPath = await this.saveCompressedToFile(
                            compressed.buffer, 
                            cacheKey, 
                            'gz'
                        );
                        savedFiles.compressedFile = compressedPath;
                    }
                    
                    // Set compression headers
                    res.setHeader('Content-Type', 'application/json');
                    res.setHeader('Content-Encoding', compressed.contentEncoding);
                    res.setHeader('Cache-Control', 'no-cache');
                    res.setHeader('X-Original-Size', compressed.originalSize);
                    res.setHeader('X-Compressed-Size', compressed.compressedSize);
                    res.setHeader('X-Compression-Ratio', compressed.compressionRatio + '%');
                    
                    // Add file paths to headers if files were saved
                    if (Object.keys(savedFiles).length > 0) {
                        res.setHeader('X-Saved-Files', JSON.stringify(savedFiles));
                    }
                    
                    logger.info(`Response compressed and ready to send (${compressed.compressionRatio}% reduction)`);
                    return res.send(compressed.buffer);
                    
                } catch (compressionError) {
                    logger.error('Compression failed, sending uncompressed:', compressionError);
                    // Fall back to uncompressed response
                }
            }
            
            // Add file info to response if files were saved
            if (Object.keys(savedFiles).length > 0) {
                responseData.savedFiles = savedFiles;
            }
            
            // Send uncompressed response
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Cache-Control', 'no-cache');
            logger.info('Sending uncompressed response...');
            
            // Log response size before sending
            const jsonString = JSON.stringify(responseData);
            logger.info(`Response size before compression: ${jsonString.length} bytes`);
            
            return res.json(responseData);

        } catch (error) {
            logger.error('=== DCS Data Sync Error ===', error);
            logger.error('Error stack:', error.stack);
            
            // Make sure we always send a response
            if (!res.headersSent) {
                return res.json({
                    status: "E",
                    message: "Internal server error: " + error.message,
                    error: process.env.NODE_ENV === 'development' ? error.stack : undefined
                });
            }
        }
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