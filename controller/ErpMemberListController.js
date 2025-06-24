const { pool } = require('../config/config');
const logger = require('../utils/logger');
const axios = require('axios');

// Utility: Validate Request - kept your original validation logic
const validateRequest = (params) => {
  const errors = [];

  if (!params.cono) {
    errors.push('cono is required.');
  }
  if (params.branchcode && params.branchcode.length > 4) {
    errors.push('branchcode must be max 4 characters.');
  }
  if (params.projectcode && params.projectcode.length > 3) {
    errors.push('projectcode must be max 3 characters.');
  }
  if (params.orgno && params.orgno.length > 4) {
    errors.push('orgno must be max 4 characters.');
  }

  return errors.length > 0 
    ? { valid: false, errors } 
    : { valid: true };
};

// Utility: Get Server URL - kept your original server URL logic
const getServerUrl = async () => {
  try {
    const result = await pool.query(
      `SELECT url, url2, maintenance_status, maintenance_message 
       FROM dcs.server_url 
       WHERE server_status = 3 AND status = 1 
       LIMIT 1`
    );

    if (result.rows.length === 0) {
      return { error: true, message: 'Server Api Not Found' };
    }

    const server = result.rows[0];
    if (server.maintenance_status === '1') {
      return { error: true, message: server.maintenance_message };
    }

    return { 
      error: false, 
      urls: [server.url, server.url2].filter(Boolean) 
    };
  } catch (err) {
    logger.error('Error fetching server_url:', err);
    return { error: true, message: 'Database error while fetching server URL.' };
  }
};

// Controller: Get ERP Member List - fixed parameter extraction
exports.GetErpMemberListData = async (req, res) => {
  try {
    // Extract parameters from both body and query
    const params = {
      branchcode: req.body?.branchcode || req.query?.branchcode,
      projectcode: req.body?.projectcode || req.query?.projectcode,
      orgno: req.body?.orgno || req.query?.orgno,
      cono: req.body?.cono || req.query?.cono
    };

    logger.info(`ERP Member List Request: ${JSON.stringify(params)}`);

    // Validate request
    const validation = validateRequest(params);
    if (!validation.valid) {
      return res.status(400).json({ 
        status: 'E', 
        message: validation.errors.join('\n') 
      });
    }

    const { branchcode, projectcode, orgno, cono } = params;
    const key = '5d0a4a85-df7a-scapi-bits-93eb-145f6a9902ae';

    // Get server URLs
    const serverResult = await getServerUrl();
    if (serverResult.error) {
      return res.status(400).json({ 
        status: 'CUSTMSG', 
        message: serverResult.message 
      });
    }

    if (serverResult.urls.length === 0) {
      return res.status(400).json({ 
        status: 'CUSTMSG', 
        message: 'Api Url Not Found' 
      });
    }

    // Use the first available URL
    const url = serverResult.urls[0];
    const endpoint = `${url}MemberList?` + new URLSearchParams({
      ProjectCode: projectcode || '',
      BranchCode: branchcode || '',
      CONo: cono,
      key,
      UpdatedAt: '2000-01-01 00:00:00',
      Status: '2',
      OrgNo: orgno || ''
    });

    logger.info(`Requesting ERP Member List from: ${endpoint}`);
    const response = await axios.get(endpoint);
    return res.status(200).json(response.data);

  } catch (error) {
    logger.error('Error fetching ERP member list:', error);
    return res.status(500).json({ 
      status: 'E', 
      message: 'Failed to fetch ERP member list.' 
    });
  }
};