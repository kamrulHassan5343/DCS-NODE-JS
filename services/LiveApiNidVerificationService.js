const { validationResult } = require('express-validator');
const ServerURLService = require('./ServerURLService');
const TokenCheckService = require('./TokenCheckService');
const axios = require('axios');

class LiveApiNidVerificationService {
  static async execute(req) {
    return await new LiveApiNidVerificationService().nidVerify(req);
  }

  async nidVerify(req) {
    try {
      // Validate request
      const validation = this.validateRequest(req);
      if (validation) return validation;

      // Get parameters
      const params = { ...req.query, ...req.body };
      const { type, IdNo: idno, versionCode, voCode, orgMemNo, pin, branchCode } = params;

      if (!type || !idno) {
        return this.errorResponse("ERROR", `${!type ? "Type" : "IdNo"} parameter is missing`);
      }

      // Get server URL and token
      const [serverUrls, serverToken] = await Promise.all([
        ServerURLService.server_url(),
        this.getToken()
      ]);

      if (!Array.isArray(serverUrls)) {
        return this.errorResponse("ERROR", "Invalid server URL configuration");
      }

      const baseUrl = (serverUrls[1]?.trim() || serverUrls[0]).replace(/\/$/, '') + '/';
      const apiUrl = `${baseUrl}dedupe-check?${type}=${idno}`;

      // Make API call
      const response = await axios.get(apiUrl, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serverToken}`
        },
        timeout: 60000
      });

      // Process response
      return this.processResponse(response.data, response.status, { 
        type, idno, versionCode, voCode, pin, branchCode 
      });

    } catch (error) {
      console.error('NID verification failed:', error);
      return this.handleError(error);
    }
  }

  async getToken() {
    const tokenResult = await TokenCheckService.check_token();
    const token = tokenResult?.token || tokenResult;
    if (!token) throw new Error("Token Not Found");
    return token;
  }

  async processResponse(apiData, httpCode, params) {
    const { type, idno, versionCode, voCode, pin, branchCode } = params;
    
    if (!apiData) return this.formatResponse(httpCode, type, "", []);

    const idValue = apiData[type] || idno;
    const suspects = apiData.suspectedMember || [];

    // Simple response if no version code or no suspects
    if (!versionCode || !suspects.length) {
      return this.formatResponse(httpCode, type, idValue, suspects);
    }

    const suspect = suspects[0];
    
    // Check if suspect matches current branch/pin/vo
    if (suspect.branchCode === branchCode && 
        pin === suspect.assignedPoPin && 
        suspect.voCode === voCode) {
      return this.formatResponse(httpCode, type, idValue, "");
    }

    // Generate mismatch message
    const details = await this.getSuspectDetails(suspect);
    const message = this.buildMismatchMessage(suspect, details);
    
    return this.formatResponse(httpCode, type, idValue, message);
  }

  async getSuspectDetails(suspect) {
    try {
      const [branchInfo, poInfo, contactInfo] = await Promise.all([
        this.getBranchInfo(suspect.branchCode),
        this.getPoInfo(suspect.assignedPoPin, suspect.branchCode),
        this.getContactInfo(suspect.branchCode)
      ]);
      return { branchInfo, poInfo, contactInfo };
    } catch (error) {
      console.error('Failed to get suspect details:', error);
      return { branchInfo: null, poInfo: null, contactInfo: null };
    }
  }

  buildMismatchMessage(suspect, { branchInfo, poInfo, contactInfo }) {
    return `দুঃখিত, আপনার প্রদত্ত এনআইডি/স্মার্টকার্ড/জন্ম নিবন্ধন/পাসপোর্ট নম্বরটি দিয়ে ব্র্যাকের নিম্নোক্ত শাখায় সদস্য ভর্তি আছে।

বিভাগ: ${branchInfo?.division_name || 'N/A'}
অঞ্চল: ${branchInfo?.region_name || 'N/A'}
এলাকা: ${branchInfo?.area_name || 'N/A'}
শাখা: ${branchInfo?.branch_name || 'N/A'}
শাখা কোড: ${suspect.branchCode}
ভিও কোড: ${suspect.voCode}
সদস্য নম্বর: ${suspect.memberNo}
সদস্য নাম: ${suspect.memberName}
পিও'র নাম: ${poInfo?.coname || 'N/A'}
পিও'র পিন: ${suspect.assignedPoPin}
শাখায় যোগাযোগের নম্বর: ${contactInfo?.official_mobile || 'N/A'}`;
  }

  // Database methods - simplified with better error handling
  async getBranchInfo(branchcode) {
    const connection = await this.getDatabaseConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT branch_name, area_name, region_name, division_name 
         FROM branch 
         WHERE branch_id = ? AND program_id = 1`,
        [branchcode]
      );
      return rows[0] || null;
    } finally {
      await connection.end();
    }
  }

  async getPoInfo(po, branchcode) {
    const connection = await this.getDatabaseConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT coname FROM dcs.polist WHERE cono = ? AND branchcode = ?`,
        [po, branchcode]
      );
      return rows[0] || null;
    } finally {
      await connection.end();
    }
  }

  async getContactInfo(branchcode) {
    const connection = await this.getDatabaseConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT official_mobile 
         FROM dcs.contacts_info 
         WHERE branchcode = ? AND project = 'Dabi'`,
        [parseInt(branchcode)]
      );
      return rows[0] || null;
    } finally {
      await connection.end();
    }
  }

  // Utility methods
  validateRequest(req) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const message = errors.array().map(e => e.msg).join("\n");
      return this.errorResponse("E", message);
    }
    return null;
  }

  formatResponse(status, type, idValue, suspectedMember) {
    return JSON.stringify({ status, [type]: idValue, suspectedMember });
  }

  errorResponse(status, message) {
    return JSON.stringify({ status, message });
  }

  handleError(error) {
    if (error.response) {
      return this.formatResponse(
        error.response.status, "", "",
        error.response.data?.message || `API Error: ${error.message}`
      );
    }
    
    const status = (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') ? "ERROR" : "ERROR";
    const message = error.code ? `Connection Error: ${error.message}` : `Error: ${error.message}`;
    return this.errorResponse(status, message);
  }

  async getDatabaseConnection() {
    // Implement your database connection logic here
    throw new Error('Database connection method not implemented');
  }
}

module.exports = LiveApiNidVerificationService;