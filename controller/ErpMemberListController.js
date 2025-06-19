const { pool } = require('../config/config');
const logger = require('../utils/logger');
const axios = require('axios');
const moment = require('moment');

// Utility: Validate Request
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
  if (!params.cono) {
    errors.push('cono is required.');
  }

  if (errors.length > 0) {
    return {
      valid: false,
      response: { status: 'E', message: errors.join('\n') },
    };
  }
  return { valid: true };
};

// Utility: Get Server URL
const getServerUrl = async () => {
  try {
    const result = await pool.query(
      `SELECT * FROM dcs.server_url WHERE server_status = 3 AND status = 1 LIMIT 1`
    );

    if (result.rows.length === 0) {
      return {
        error: true,
        response: { status: 'CUSTMSG', message: 'Server Api Not Found' },
      };
    }

    const server = result.rows[0];

    if (server.maintenance_status === '1') {
      return {
        error: true,
        response: { status: 'CUSTMSG', message: server.maintenance_message },
      };
    }

    return {
      error: false,
      urls: [server.url, server.url2, server.server_url],
    };
  } catch (err) {
    logger.error('Error fetching server_url:', err);
    return {
      error: true,
      response: { status: 'CUSTMSG', message: 'Database error while fetching server URL.' },
    };
  }
};

// Controller: Get ERP Member List
exports.GetErpMemberListData = async (req, res) => {
  // Extract params from body or query
  const params = {
    branchcode: req.body.branchcode || req.query.branchcode,
    projectcode: req.body.projectcode || req.query.projectcode,
    orgno: req.body.orgno || req.query.orgno,
    cono: req.body.cono || req.query.cono,
  };

  logger.info(`ERP Member List Request: ${JSON.stringify(params)}`);

  // Validate request
  const validation = validateRequest(params);
  if (!validation.valid) {
    return res.status(400).json(validation.response);
  }

  const { branchcode, projectcode, orgno, cono } = params;
  const lastSyncTime = '2000-01-01 00:00:00';
  const key = '5d0a4a85-df7a-scapi-bits-93eb-145f6a9902ae';

  // Get server URLs
  const serverResult = await getServerUrl();
  if (serverResult.error) {
    return res.status(400).json(serverResult.response);
  }

  const [url, url2] = serverResult.urls;
  if (!url && !url2) {
    return res.status(400).json({ status: 'CUSTMSG', message: 'Api Url Not Found' });
  }

  try {
    const endpoint = `${url}MemberList?ProjectCode=${projectcode}&BranchCode=${branchcode}&CONo=${cono}&key=${key}&UpdatedAt=${encodeURIComponent(lastSyncTime)}&Status=2&OrgNo=${orgno}`;
    logger.info(`Requesting ERP Member List from: ${endpoint}`);

    const response = await axios.get(endpoint);
    return res.status(200).json(response.data);
  } catch (error) {
    logger.error('Error fetching ERP member list:', error);
    return res.status(500).json({ status: 'E', message: 'Failed to fetch ERP member list.' });
  }
};
