const { check, validationResult } = require('express-validator');
const ServerURLService = require('./ServerURLService');
const TokenCheckService = require('./TokenCheckService');
const axios = require('axios');

class SavingsTransactionService {
  constructor() {
    this.key = '5d0a4a85-df7a-scapi-bits-93eb-145f6a9902ae';
    this.validToken = '7f30f4491cb4435984616d1913e88389';
  }

  static async savings_transaction(req) {
    const instance = new SavingsTransactionService();
    return await instance.processSavingsTransaction(req);
  }

  async processSavingsTransaction(req) {
    try {
      console.log('🔍 Processing request with query:', req.query);

      // Step 1: Validate request
      const validationError = this.getValidated(req);
      if (typeof validationError === 'string') {
        console.log('⚠️ Validation error:', validationError);
        return validationError;
      }

      const { token, branchcode, orgno, orgmemno, projectcode } = req.query;

      // Step 2: Validate token
      if (token !== this.validToken) {
        const msg = [{ message: "Invalid token!" }];
        return {
          status: 'E',
          message: msg,
          code: "400"
        };
      }

      // Step 3: Get server URLs
      const serverUrls = await ServerURLService.server_url();
      if (typeof serverUrls === 'string') {
        console.log('❌ Server URL error:', serverUrls);
        return serverUrls;
      }

      const [urlindex] = serverUrls;
      if (!urlindex) {
        const status = { status: "CUSTMSG", message: "Api Url Not Found" };
        return JSON.stringify(status);
      }

      // Step 4: Get server token
      const servertoken = await TokenCheckService.check_token();
      if (!servertoken) {
        const status = { status: "CUSTMSG", message: "Token Not Found" };
        return JSON.stringify(status);
      }

      // Step 5: Build date range (2 years back)
      const cdate = new Date().toISOString().split('T')[0];
      const frmdate = new Date();
      frmdate.setFullYear(frmdate.getFullYear() - 2);
      const formattedFromDate = frmdate.toISOString().split('T')[0];

      // Step 6: Determine project code
      const projectCode = projectcode === 'Progoti' ? '060' : '015';

      // Step 7: Build API URL based on parameters
      let apiUrl;
      if (orgno && orgmemno && branchcode) {
        apiUrl = `${urlindex}TransactionsSavings?BranchCode=${branchcode}&OrgNo=${orgno}&OrgMemNo=${orgmemno}&key=${this.key}&StartDate=${formattedFromDate}&EndDate=${cdate}&ProjectCode=${projectCode}`;
      } else if (orgmemno && branchcode) {
        apiUrl = `${urlindex}TransactionsSavings?BranchCode=${branchcode}&OrgMemNo=${orgmemno}&key=${this.key}&StartDate=${formattedFromDate}&EndDate=${cdate}&ProjectCode=${projectCode}`;
      } else {
        const msg = [{ message: "Please choose MemberId or Orgmemno and OrgNo!" }];
        return {
          status: 'E',
          message: msg,
          code: "400"
        };
      }

      // Step 8: Encode spaces in URL
      apiUrl = apiUrl.replace(/ /g, '%20');
      console.log('📡 Final API URL:', apiUrl);

      // Step 9: Make API call
      const response = await axios.get(apiUrl, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${servertoken}`
        },
        timeout: 30000
      });

      // Step 10: Return raw response
      return response.data;

    } catch (error) {
      console.error('❌ API call error:', error.message);
      
      if (error.response) {
        console.error('📨 API response error:', error.response.data);
        return error.response.data;
      } else if (error.request) {
        console.error('🚫 Network error - No response received');
        const status = { status: "CUSTMSG", message: "Network error - unable to reach API" };
        return JSON.stringify(status);
      } else {
        console.error('💥 Unexpected error:', error.message);
        const status = { status: "CUSTMSG", message: "An unexpected error occurred" };
        return JSON.stringify(status);
      }
    }
  }

  getValidated(req) {
    const { branchcode, orgno, orgmemno, projectcode } = req.query;
    const errors = [];

    if (branchcode && (typeof branchcode !== 'string' || branchcode.length > 4)) {
      errors.push('The branchcode field must be a string and may not be greater than 4 characters.');
    }

    if (orgno && (typeof orgno !== 'string' || orgno.length > 4)) {
      errors.push('The orgno field must be a string and may not be greater than 4 characters.');
    }

    if (orgmemno && (typeof orgmemno !== 'string' || orgmemno.length > 10)) {
      errors.push('The orgmemno field must be a string and may not be greater than 10 characters.');
    }

    if (projectcode && (typeof projectcode !== 'string' || projectcode.length > 3)) {
      errors.push('The projectcode field must be a string and may not be greater than 3 characters.');
    }

    if (errors.length > 0) {
      const message = errors.join('\n');
      return JSON.stringify({ status: "E", message: message });
    }

    return true;
  }
}

module.exports = SavingsTransactionService;