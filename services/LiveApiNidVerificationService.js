const { validationResult } = require('express-validator');
const ServerURLService = require('./ServerURLService');
const TokenCheckService = require('./TokenCheckService');
const axios = require('axios');

class LiveApiNidVerificationService {
  constructor() {
    this.token = null;
    this.tokenExpiry = null;
  }

  static async execute(req) {
    return await new LiveApiNidVerificationService().nidVerify(req);
  }

  async nidVerify(req) {
    try {
      // 1. Validate request
      const validation = await this.validateRequest(req);
      if (validation) return validation;

      // 2. Get server URLs
      const serverUrls = await ServerURLService.server_url();
      if (!Array.isArray(serverUrls)) {  // Fixed the missing parenthesis here
        return this.errorResponse("ERROR", "Invalid server URL configuration");
      }
      
      const [url, url2Raw] = serverUrls;
      const url2 = url2Raw?.trim() || url;

      // 3. Get or refresh token
      let serverToken;
      try {
        const tokenResult = await TokenCheckService.check_token();
        serverToken = tokenResult?.token || tokenResult;
      } catch (tokenError) {
        console.error('Token check failed:', tokenError);
        return this.errorResponse("CUSTMSG", "Token Not Found");
      }

      if (!serverToken) {
        return this.errorResponse("CUSTMSG", "Token Not Found");
      }

      // 4. Extract parameters
      const params = Object.assign({}, req.query, req.body);
      const { type, IdNo: idno, versionCode = '', voCode: voCode1, orgMemNo, pin, branchCode } = params;

      if (!type || !idno) {
        return this.errorResponse("ERROR", `${!type ? "Type" : "IdNo"} parameter is missing`);
      }

      // 5. Make API call
      const baseUrl = url2.endsWith('/') ? url2 : `${url2}/`;
      const apiUrl = `${baseUrl}dedupe-check?${type}=${idno}`;
      
      const response = await axios.get(apiUrl, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serverToken}`
        },
        timeout: 60000
      });

      // 6. Process response
      return this.processResponse(response, { 
        type, idno, versionCode, voCode1, pin, branchCode 
      });

    } catch (error) {
      console.error('NID verification failed:', error);
      return this.handleError(error);
    }
  }

  async processResponse(response, params) {
    const { data: apiData, status: httpCode } = response;
    const { type, idno, versionCode, voCode1, pin, branchCode } = params;

    if (!apiData) return this.formatResponse(httpCode, type, "", []);

    if (!versionCode) {
      return this.formatResponse(
        httpCode, 
        type, 
        apiData[type] || idno, 
        apiData.suspectedMember || ""
      );
    }

    const suspects = apiData.suspectedMember || [];
    if (!suspects.length) return this.formatResponse(httpCode, type, apiData[type] || idno, "");

    const suspect = suspects[0];
    if (suspect.branchCode !== branchCode || pin !== suspect.assignedPoPin || suspect.voCode !== voCode1) {
      const { branchInfo, poInfo, contactInfo } = await this.getSuspectDetails(suspect);
      
      const message = `দুঃখিত, আপনার প্রদত্ত এনআইডি/স্মার্টকার্ড/জন্ম নিবন্ধন/পাসপোর্ট নম্বরটি দিয়ে ব্র্যাকের নিম্নোক্ত শাখায় সদস্য ভর্তি আছে।\n\n` +
        `বিভাগ: ${branchInfo?.division_name}\n` +
        `অঞ্চল: ${branchInfo?.region_name}\n` +
        `এলাকা: ${branchInfo?.area_name}\n` +
        `শাখা: ${branchInfo?.branch_name}\n` +
        `শাখা কোড: ${suspect.branchCode}\n` +
        `ভিও কোড: ${suspect.voCode}\n` +
        `সদস্য নম্বর: ${suspect.memberNo}\n` +
        `সদস্য নাম: ${suspect.memberName}\n` +
        `পিও'র নাম: ${poInfo?.coname}\n` +
        `পিও'র পিন: ${suspect.assignedPoPin}\n` +
        `শাখায় যোগাযোগের নম্বর:${contactInfo?.official_mobile}`;

      return this.formatResponse(httpCode, type, apiData[type] || idno, message);
    }

    return this.formatResponse(httpCode, type, apiData[type] || idno, "");
  }

  async getSuspectDetails(suspect) {
    const [branchInfo, poInfo, contactInfo] = await Promise.all([
      this.getBranchInfo(suspect.branchCode),
      this.getPoInfo(suspect.assignedPoPin, suspect.branchCode),
      this.getContactInfo(suspect.branchCode)
    ]);
    return { branchInfo, poInfo, contactInfo };
  }

  formatResponse(status, type, idValue, suspectedMember) {
    return JSON.stringify({ status, [type]: idValue, suspectedMember });
  }

  errorResponse(status, message) {
    return JSON.stringify({ status, message });
  }

  async validateRequest(req) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const message = errors.array().map(e => e.msg).join("\n");
      return this.errorResponse("E", message);
    }
    return null;
  }

  handleError(error) {
    if (error.response) {
      return this.formatResponse(
        error.response.status,
        "",
        "",
        error.response.data?.message || `API Error: ${error.message}`
      );
    }
    return this.errorResponse(
      error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' ? "ERROR" : "ERROR",
      error.code ? `Connection Error: ${error.message}` : `Error: ${error.message}`
    );
  }

  // Database methods
  async getPoInfo(po, branchcode) {
    try {
      // Replace with your actual database connection
      const connection = await this.getDatabaseConnection();
      const [rows] = await connection.execute(
        `SELECT coname FROM dcs.polist WHERE cono = ? AND branchcode = ?`,
        [po, branchcode]
      );
      await connection.end();
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Database query failed for PO info:', error);
      return null;
    }
  }

  async getBranchInfo(branchcode) {
    try {
      const connection = await this.getDatabaseConnection();
      const [rows] = await connection.execute(
        `SELECT branch_name, area_name, region_name, division_name 
         FROM branch 
         WHERE branch_id = ? AND program_id = 1`,
        [branchcode]
      );
      await connection.end();
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Database query failed for branch info:', error);
      return null;
    }
  }

  async getContactInfo(branchcode) {
    try {
      const connection = await this.getDatabaseConnection();
      const [rows] = await connection.execute(
        `SELECT official_mobile 
         FROM dcs.contacts_info 
         WHERE branchcode = ? AND project = 'Dabi'`,
        [parseInt(branchcode)]
      );
      await connection.end();
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Database query failed for contact info:', error);
      return null;
    }
  }

  async getDatabaseConnection() {
    // Implement your database connection logic here
    // Example: return await mysql.createConnection(config);
    throw new Error('Database connection method not implemented');
  }
}

module.exports = LiveApiNidVerificationService;