const axios = require('axios');
const { pool } = require('../config/config');
const logger = require('../utils/logger');

const API_KEY = '5d0a4a85-df7a-scapi-bits-93eb-145f6a9902ae';

// Shared utility functions
const validateParams = (params) => {
  const rules = [
    { field: 'orgno', max: 4 },
    { field: 'orgmemno', max: 10 },
    { field: 'branchcode', max: 4 },
    { field: 'projectcode', max: 3 }
  ];

  const errors = rules
    .filter(rule => params[rule.field] && params[rule.field].length > rule.max)
    .map(rule => `${rule.field} must be max ${rule.max} characters`);

  return errors.length ? { valid: false, errors } : { valid: true };
};

const getActiveServerUrl = async () => {
  try {
    const { rows: [server] } = await pool.query(`
      SELECT url, maintenance_status, maintenance_message 
      FROM dcs.server_url 
      WHERE server_status = 3 AND status = 1 
      LIMIT 1
    `);

    if (!server) return { error: 'API URL not found' };
    if (server.maintenance_status === '1') return { error: server.maintenance_message };
    
    return { url: server.url };
  } catch (err) {
    logger.error('Database error:', err);
    return { error: 'Failed to get server URL' };
  }
};

const buildApiUrl = (basePath, params, requiredFields = []) => {
  const missingFields = requiredFields.filter(field => !params[field]);
  if (missingFields.length) {
    return { error: `Missing required fields: ${missingFields.join(', ')}` };
  }

  const query = new URLSearchParams({
    ProjectCode: params.projectcode || '',
    BranchCode: params.branchcode || '',
    key: API_KEY,
    ...(params.orgno && { OrgNo: params.orgno }),
    ...(params.orgmemno && { OrgMemNo: params.orgmemno }),
    ...(params.loanno && { LoanNo: params.loanno })
  });

  return { url: `${basePath}?${query}` };
};

// Controllers
exports.GetLoanBehaviourDetails = async (req, res) => {
  const params = { ...req.body, ...req.query };
  logger.info('Loan Behaviour Details Request:', params);

  const validation = validateParams(params);
  if (!validation.valid) {
    return res.status(400).json({ status: 'E', message: validation.errors.join('\n') });
  }

  const server = await getActiveServerUrl();
  if (server.error) {
    return res.status(400).json({ status: 'CUSTMSG', message: server.error });
  }

  const apiUrl = buildApiUrl(`${server.url}LoanBehavior`, params, ['loanno']);
  if (apiUrl.error) {
    return res.status(400).json({ status: 'E', message: apiUrl.error });
  }

  try {
    logger.info('Calling API:', apiUrl.url);
    const { data } = await axios.get(apiUrl.url);
    return res.json(data);
  } catch (error) {
    logger.error('API Error:', error.message);
    return res.status(500).json({ status: 'E', message: 'Failed to fetch loan details' });
  }
};

exports.GetLoanBehaviour = async (req, res) => {
  const params = { ...req.body, ...req.query };
  logger.info('Loan Behaviour Request:', params);

  const validation = validateParams(params);
  if (!validation.valid) {
    return res.status(400).json({ status: 'E', message: validation.errors.join('\n') });
  }

  const server = await getActiveServerUrl();
  if (server.error) {
    return res.status(400).json({ status: 'CUSTMSG', message: server.error });
  }

  const apiUrl = buildApiUrl(`${server.url}LoanDetails`, params);
  if (apiUrl.error) {
    return res.status(400).json({ status: 'E', message: apiUrl.error });
  }

  try {
    logger.info('Calling API:', apiUrl.url);
    const { data } = await axios.get(apiUrl.url);
    return res.json(data);
  } catch (error) {
    logger.error('API Error:', error.message);
    return res.status(500).json({ status: 'E', message: 'Failed to fetch loan behavior' });
  }
};