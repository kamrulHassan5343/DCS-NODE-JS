const { validationResult } = require('express-validator');
const ServerURLService = require('./ServerURLService');
const TokenCheckService = require('./TokenCheckService');
const axios = require('axios');

class LiveApiNidVerificationService {
  constructor() {
    this.db = 'dcs'; // Database name like in Laravel
  }

  // Static method for external usage
  static async execute(req) {
    const instance = new LiveApiNidVerificationService();
    return await instance.nidVerify(req);
  }

  async nidVerify(req) {
    try {
      // 1. Validation (following Laravel's get_validated method)
      const validation = await this.getValidated(req);
      if (typeof validation === 'string') {
        return validation; // Return validation error JSON string
      }

      // 2. Get server URLs (following Laravel logic)
      const serverUrls = await ServerURLService.server_url();
      if (typeof serverUrls === 'string') {
        return serverUrls; // Return error if server URL service fails
      }
      
      // Validate that we have an array
      if (!Array.isArray(serverUrls) || serverUrls.length === 0) {
        const status = { status: "ERROR", message: "Invalid server URL configuration" };
        return JSON.stringify(status);
      }
      
      const [url, url2Raw] = serverUrls;
      
      // Use first URL if second URL is empty (fallback logic)
      const url2 = url2Raw && url2Raw.trim() !== '' ? url2Raw : url;

      // 3. Get server token (following Laravel logic)
      const serverTokenArray = await TokenCheckService.check_token();
      const serverToken = serverTokenArray?.token || serverTokenArray;
      
      if (!serverToken) {
        const status = { status: "CUSTMSG", message: "Token Not Found" };
        return JSON.stringify(status);
      }

      // 4. Extract request parameters (following Laravel parameter extraction)
      const type = req.body?.type || req.query?.type;
      const idno = req.body?.IdNo || req.query?.IdNo;
      const appId = req.body?.appId || req.query?.appId;
      const versionCode = req.body?.versionCode || req.query?.versionCode || '';
      const voCode1 = req.body?.voCode || req.query?.voCode;
      const orgMemNo = req.body?.orgMemNo || req.query?.orgMemNo;
      const pin = req.body?.pin || req.query?.pin;
      const branchCode = req.body?.branchCode || req.query?.branchCode;

      // 5. Debug and validate parameters before building URL
      console.log("Debug - Parameters received:");
      console.log("- url (first):", url);
      console.log("- url2Raw (second):", url2Raw);
      console.log("- url2 (final):", url2);
      console.log("- type:", type);
      console.log("- idno:", idno);
      console.log("- serverUrls array:", serverUrls);

      // Validate required parameters
      if (!url2 || url2.trim() === '') {
        throw new Error("Base URL (url2) is missing or empty after fallback");
      }
      if (!type) {
        throw new Error("Type parameter is missing or empty");
      }
      if (!idno) {
        throw new Error("IdNo parameter is missing or empty");
      }

      // Ensure url2 ends with proper separator
      const baseUrl = url2.endsWith('/') ? url2 : url2 + '/';
      
      // 5. Build API URL exactly like Laravel: url2 + "dedupe-check?" + type + "=" + idno
      const url4 = `${baseUrl}dedupe-check?${type}=${idno}`;
      console.log("Nid Verification URL:", url4);

      // 6. Make API call with proper headers
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serverToken}`
      };

      const response = await axios.get(url4, {
        headers,
        timeout: 60000
      });

      const outputClosed = response.data;
      const httpCode = response.status;
      console.log("Nid_Ser", JSON.stringify(outputClosed));

      // 7. Process response following Laravel logic
      const jsondecodeNID = outputClosed;
      console.log("API Response:", JSON.stringify(jsondecodeNID));

      if (versionCode !== '') {
        // When versionCode is provided, follow Laravel's complex logic
        if (jsondecodeNID != null) {
          const suspectMemberjsondecode = jsondecodeNID.suspectedMember;
          
          if (suspectMemberjsondecode && Array.isArray(suspectMemberjsondecode) && suspectMemberjsondecode.length > 0) {
            const branchcode = suspectMemberjsondecode[0].branchCode;
            const po = suspectMemberjsondecode[0].assignedPoPin;
            const voCode = suspectMemberjsondecode[0].voCode || '';
            const memberName = suspectMemberjsondecode[0].memberName;
            const memberNo = suspectMemberjsondecode[0].memberNo;

            // Get PO info from database
            const poInfo = await this.getPoInfo(po, branchcode);
            const poname = poInfo ? poInfo.coname : '';

            // Get branch info from database
            const branchInfo = await this.getBranchInfo(branchcode);
            let branchname = '', areaname = '', regionname = '', divisionname = '';
            if (branchInfo) {
              branchname = branchInfo.branch_name;
              areaname = branchInfo.area_name;
              regionname = branchInfo.region_name;
              divisionname = branchInfo.division_name;
            }

            // Get PO phone from database
            const contactInfo = await this.getContactInfo(branchcode);
            const phoneno = contactInfo ? contactInfo.official_mobile : '';

            // Check if branch code, pin, or voCode don't match (Laravel condition)
            if (branchcode !== branchCode || pin !== po || voCode !== voCode1) {
              const datasetNID = {
                status: httpCode,
                [type]: jsondecodeNID[type] || idno, // Use original ID if API doesn't return it
                suspectedMember: `দুঃখিত, আপনার প্রদত্ত এনআইডি/স্মার্টকার্ড/জন্ম নিবন্ধন/পাসপোর্ট নম্বরটি দিয়ে ব্র্যাকের নিম্নোক্ত শাখায় সদস্য ভর্তি আছে।\n\nবিভাগ: ${divisionname}\nঅঞ্চল: ${regionname}\nএলাকা: ${areaname}\nশাখা: ${branchname}\nশাখা কোড: ${branchcode}\nভিও কোড: ${voCode}\nসদস্য নম্বর: ${memberNo}\nসদস্য নাম: ${memberName}\nপিও'র নাম: ${poname}\nপিও'র পিন: ${po}\nশাখায় যোগাযোগের নম্বর:${phoneno}`
              };
              return JSON.stringify(datasetNID);
            } else {
              const datasetNID = {
                status: httpCode,
                [type]: jsondecodeNID[type] || idno, // Use original ID if API doesn't return it
                suspectedMember: ""
              };
              return JSON.stringify(datasetNID);
            }
          } else {
            // No suspected members found
            const datasetNID = {
              status: httpCode,
              [type]: jsondecodeNID[type] || idno, // Use original ID if API doesn't return it
              suspectedMember: ""
            };
            return JSON.stringify(datasetNID);
          }
        } else {
          const datasetNID = {
            status: httpCode,
            [type]: "",
            suspectedMember: ""
          };
          return JSON.stringify(datasetNID);
        }
      } else {
        // When versionCode is not provided, return original response
        if (jsondecodeNID != null) {
          const datasetNID = {
            status: httpCode,
            [type]: jsondecodeNID[type] || idno, // Use original ID if API doesn't return it
            suspectedMember: jsondecodeNID.suspectedMember || ""
          };
          return JSON.stringify(datasetNID);
        } else {
          const datasetNID = {
            status: httpCode,
            [type]: "",
            suspectedMember: []
          };
          return JSON.stringify(datasetNID);
        }
      }

    } catch (error) {
      console.error('NID verification failed:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status
      });
      
      if (error.response) {
        // HTTP error response
        const httpCode = error.response.status;
        const datasetNID = {
          status: httpCode,
          message: error.response.data?.message || `API Error: ${error.message}`,
          suspectedMember: ""
        };
        return JSON.stringify(datasetNID);
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        // DNS or connection error
        const datasetNID = {
          status: "ERROR",
          message: `Connection Error: ${error.message}`,
          suspectedMember: ""
        };
        return JSON.stringify(datasetNID);
      } else {
        // Other errors (including Invalid URL)
        const datasetNID = {
          status: "ERROR",
          message: `Error: ${error.message}`,
          suspectedMember: ""
        };
        return JSON.stringify(datasetNID);
      }
    }
  }

  // Database helper methods (you'll need to implement database connection)
  async getPoInfo(po, branchcode) {
    try {
      // Replace with your actual database connection
      const connection = await this.getDatabaseConnection();
      const [rows] = await connection.execute(
        `SELECT coname FROM ${this.db}.polist WHERE cono = ? AND branchcode = ?`,
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
         FROM ${this.db}.contacts_info 
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

  
  // Validation method following Laravel's get_validated logic
  async getValidated(req) {
    const arrayToValidate = {
      // Add validation rules as needed - Laravel had them commented out
      // type: 'nullable|string',
      // IdNo: 'nullable|string',
      // appId: 'nullable|string',
      // versionCode: 'nullable|string',
    };

    // Since Laravel validation was mostly empty, we'll do basic validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      let message = '';
      errors.array().forEach(error => {
        message += error.msg + "\n";
      });
      return JSON.stringify({ status: "E", message: message });
    }

    return true;
  }
}

module.exports = LiveApiNidVerificationService;