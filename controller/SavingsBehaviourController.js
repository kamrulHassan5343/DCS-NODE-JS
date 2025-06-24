const axios = require('axios');
const moment = require('moment');
const { pool } = require('../config/config');
const logger = require('../utils/logger');

const API_KEY = '5d0a4a85-df7a-scapi-bits-93eb-145f6a9902ae';

const getActiveServerUrl = async () => {
  try {
    const { rows: [server] } = await pool.query(
      `SELECT url, maintenance_status, maintenance_message 
       FROM dcs.server_url 
       WHERE server_status = 3 AND status = 1 
       LIMIT 1`
    );

    if (!server) return { error: 'Api Url Not Found' };
    if (server.maintenance_status === '1') return { error: server.maintenance_message };
    
    return { url: server.url };
  } catch (err) {
    logger.error('Server URL error:', err);
    return { error: 'Database error' };
  }
};

const validateParams = (params) => {
  const errors = [];
  if (params.branchcode?.length > 4) errors.push('branchcode max 4 chars');
  if (params.projectcode?.length > 3) errors.push('projectcode max 3 chars');
  if (params.orgno?.length > 4) errors.push('orgno max 4 chars');
  if (params.orgmemno?.length > 10) errors.push('orgmemno max 10 chars');
  if (!params.memberid && (!params.orgno || !params.orgmemno)) {
    errors.push('Need memberid OR orgno+orgmemno');
  }
  return errors.length ? errors.join(', ') : null;
};

exports.GetSavingsBehaviourDetails = async (req, res) => {
  try {
    const params = req.query;
    const error = validateParams(params);
    if (error) return res.status(400).json({ status: 'E', message: error });

    const { url, error: serverError } = await getActiveServerUrl();
    if (serverError) return res.status(500).json({ status: 'E', message: serverError });

    const todate = moment().format('YYYY-MM-DD');
    const identifier = params.orgno && params.orgmemno 
      ? `OrgNo=${params.orgno}&OrgMemNo=${params.orgmemno}`
      : `MemberId=${params.memberid}`;

    const apiUrl = `${url}SavingsBehavior?ProjectCode=${params.projectcode}&BranchCode=${params.branchcode}&${identifier}&key=${API_KEY}&FromDate=2021-01-01&ToDate=${todate}`;
    
    const { data } = await axios.get(apiUrl);
    return res.json({ code: 200, data });

  } catch (err) {
    logger.error("SavingsBehaviour error:", err.message);
    return res.status(500).json({ status: 'E', message: 'Server error' });
  }
};

exports.GetSavingsBehaviourList = async (req, res) => {
  try {
    const params = req.method === 'POST' ? req.body : req.query;
    const error = validateParams(params);
    if (error) return res.status(400).json({ status: 'E', message: error });

    const { url, error: serverError } = await getActiveServerUrl();
    if (serverError) return res.status(500).json({ status: 'E', message: serverError });

    const query = new URLSearchParams({
      ProjectCode: params.projectcode,
      BranchCode: params.branchcode,
      key: API_KEY,
      ...(params.orgno && { OrgNo: params.orgno }),
      ...(params.orgmemno && { OrgMemNo: params.orgmemno })
    });

    const { data } = await axios.get(`${url}SavingsOrSecurityDetails?${query}`);
    return res.json(data);

  } catch (err) {
    logger.error("SavingsBehaviourList error:", err.message);
    return res.status(500).json({ status: 'E', message: 'Server error' });
  }
};