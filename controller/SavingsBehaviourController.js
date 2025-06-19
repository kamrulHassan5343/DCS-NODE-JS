const axios = require('axios');
const moment = require('moment');
const { pool } = require('../config/config');
const logger = require('../utils/logger');

// ✅ Get Server URL
const getServerUrl = async () => {
  try {
    const result = await pool.query(
      `SELECT * FROM dcs.server_url WHERE server_status = 3 AND status = 1 LIMIT 1`
    );

    if (result.rows.length === 0) {
      return {
        error: true,
        response: { status: 'CUSTMSG', message: 'Api Url Not Found' }
      };
    }

    const server = result.rows[0];

    if (server.maintenance_status === '1') {
      return {
        error: true,
        response: { status: 'CUSTMSG', message: server.maintenance_message }
      };
    }

    return {
      error: false,
      urls: [server.url, server.url2]
    };
  } catch (err) {
    logger.error('Error fetching server_url:', err);
    return {
      error: true,
      response: { status: 'CUSTMSG', message: 'Database error while fetching server URL.' }
    };
  }
};

// ✅ Controller: GET /api/savings_behaviour_details
exports.GetSavingsBehaviourDetails = async (req, res, next) => {
  try {
    const { branchcode, projectcode, memberid, orgno, orgmemno } = req.query;

    // ✅ Input validation
    const errors = [];
    if (branchcode && branchcode.length > 4) errors.push("branchcode must be max 4 characters");
    if (projectcode && projectcode.length > 3) errors.push("projectcode must be max 3 characters");
    if (orgno && orgno.length > 4) errors.push("orgno must be max 4 characters");
    if (orgmemno && orgmemno.length > 10) errors.push("orgmemno must be max 10 characters");
    if (!memberid && (!orgno || !orgmemno)) errors.push("Either memberid or both orgno and orgmemno must be provided");

    if (errors.length > 0) {
      return res.status(400).json({ status: "E", message: errors.join("\n") });
    }

    // ✅ Get server URLs
    const serverUrls = await getServerUrl();
    const { error, urls, response } = serverUrls;

    if (error) {
      return res.status(500).json(response);
    }

    const [url, url2] = urls;
    if (!url) {
      return res.status(500).json({ status: "CUSTMSG", message: "Api Url Not Found" });
    }

    // ✅ Prepare external API URL
    const key = "5d0a4a85-df7a-scapi-bits-93eb-145f6a9902ae";
    const fromdate = '2021-01-01';
    const todate = moment().format('YYYY-MM-DD');

    let whereQuery = '';
    if (orgno && orgmemno) {
      whereQuery = `OrgNo=${orgno}&OrgMemNo=${orgmemno}`;
    } else {
      whereQuery = `MemberId=${memberid}`;
    }

    const apiUrl = `${url}SavingsBehavior?ProjectCode=${projectcode}&BranchCode=${branchcode}&${whereQuery}&key=${key}&FromDate=${fromdate}&ToDate=${todate}`;

    logger.info(`SavingsBehavior API Request URL: ${apiUrl}`);

    // ✅ External API call
    const responseData = await axios.get(apiUrl);

    return res.status(200).json({
      code: 200,
      data: responseData.data,
      message: null
    });

  } catch (error) {
    logger.error("Error in GetSavingsBehaviourDetails:", error.message);
    return res.status(500).json({ status: "E", message: "Server error occurred." });
  }
};

// ✅ Validate Request
const validateRequest = (params) => {
  const errors = [];

  if (params.branchcode && params.branchcode.length > 4) {
    errors.push('branchcode must be max 4 characters.');
  }
  if (params.projectcode && params.projectcode.length > 3) {
    errors.push('projectcode must be max 3 characters.');
  }
  if (params.orgno && params.orgno.length > 4) {
    errors.push('orgno must be max 4 characters.');
  }
  if (params.orgmemno && params.orgmemno.length > 10) {
    errors.push('orgmemno must be max 10 characters.');
  }

  if (errors.length > 0) {
    return {
      valid: false,
      response: { status: 'E', message: errors.join('\n') }
    };
  }
  return { valid: true };
};


// ✅ Main Controller Function
exports.GetSavingsBehaviourList = async (req, res, next) => {
  const params = {
    branchcode: req.body.branchcode || req.query.branchcode,
    projectcode: req.body.projectcode || req.query.projectcode,
    orgno: req.body.orgno || req.query.orgno,
    orgmemno: req.body.orgmemno || req.query.orgmemno
  };

  logger.info(`Savings Behaviour Request: ${JSON.stringify(params)}`);

  // Step 1: Validate
  const validation = validateRequest(params);
  if (!validation.valid) {
    return res.status(400).json(validation.response);
  }

  // Step 2: Get server URL
  const serverResult = await getServerUrl();
  if (serverResult.error) {
    return res.status(400).json(serverResult.response);
  }

  const [url, url2] = serverResult.urls;
  if (!url && !url2) {
    return res.status(400).json({ status: 'CUSTMSG', message: 'Api Url Not Found' });
  }

  try {
    const apiKey = '5d0a4a85-df7a-scapi-bits-93eb-145f6a9902ae';
    const queryParams = new URLSearchParams({
      ProjectCode: params.projectcode || '',
      BranchCode: params.branchcode || '',
      key: apiKey
    });

    if (params.orgno) {
      queryParams.append('OrgNo', params.orgno);
    }
    if (params.orgmemno) {
      queryParams.append('OrgMemNo', params.orgmemno);
    }

    const finalUrl = `${url}SavingsOrSecurityDetails?${queryParams.toString()}`;
    logger.info(`Calling Savings API: ${finalUrl}`);

    const response = await axios.get(finalUrl);
    return res.status(200).json(response.data);
  } catch (error) {
    logger.error('Error fetching Savings Behaviour List:', error.message);
    return res.status(500).json({ status: 'E', message: 'Failed to fetch savings behaviour list.' });
  }
};




