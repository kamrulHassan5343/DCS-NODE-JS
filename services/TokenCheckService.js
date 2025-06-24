const axios = require('axios');
const moment = require('moment');
const { pool } = require('../config/config');
const logger = require('../utils/logger');

// Constants
const VALID_TOKEN = '7f30f4491cb4435984616d1913e88389';
const DB_SCHEMA = process.env.DB_SCHEMA || 'dcs';

// Utilities
const padZero = (str, length) => str.toString().padStart(length, '0');
const validateToken = (token) => token === VALID_TOKEN;

const httpRequest = async (url) => {
  const { data } = await axios.get(url, {
    timeout: 30000,
    headers: { 'User-Agent': 'Node.js Application' }
  });
  return data;
};

const getServerUrl = async (client) => {
  const query = `
    SELECT url, maintenance_status, maintenance_message 
    FROM ${DB_SCHEMA}.server_url 
    WHERE server_status = 3 AND status = 1 
    LIMIT 1
  `;
  
  const { rows } = await client.query(query);
  
  if (!rows.length) {
    return { error: { status: "CUSTMSG", message: "Server Api Not Found" } };
  }
  
  const { url, maintenance_status, maintenance_message } = rows[0];
  
  if (maintenance_status === '1') {
    return { error: { status: "CUSTMSG", message: maintenance_message } };
  }
  
  return { url };
};

const buildLoanData = (data, projectcode, branchcode) => ({
  // Core loan fields
  mem_id: data.mem_id,
  loan_product: data.loan_product,
  loan_duration: data.loan_duration,
  invest_sector: data.invest_sector,
  propos_amt: data.propos_amt,
  instal_amt: data.instal_amt,
  
  // Guarantor
  grntor_name: data.grntor_name,
  grntor_phone: data.grntor_phone,
  grntor_nid: data.grntor_nid,
  
  // Insurance
  insurn_type: data.insurn_type,
  insurn_name: data.insurn_name,
  insurn_dob: data.insurn_dob,
  insurn_mainID: data.insurn_mainID,
  
  // System fields
  projectcode,
  branchcode,
  pin: data.pin,
  loan_id: data.loan_id,
  orgno: data.vo_code,
  orgmemno: data.orgmemno,
  loan_type: data.loan_type || 'New',
  brac_loancount: data.brac_loancount || 0,
  scheme: data.scheme,
  roleid: 0,
  reciverrole: 1,
  status: 1,
  update_at: moment().format('YYYY-MM-DD HH:mm:ss')
});

const buildRcaData = (dataRca, docId) => ({
  loan_id: docId,
  primary_earner: dataRca.primary_earner || 1,
  monthlyincome_main: dataRca.monthlyincome_main,
  monthlyincome_other: dataRca.monthlyincome_other,
  house_rent: dataRca.house_rent,
  food: dataRca.food,
  education: dataRca.education,
  medical: dataRca.medical,
  utility: dataRca.utility,
  saving: dataRca.saving,
  monthly_instal: dataRca.monthly_instal,
  debt: dataRca.debt,
  monthly_cash: dataRca.monthly_cash
});

const upsertData = async (client, table, data, condition) => {
  const fields = Object.keys(data);
  const fieldNames = fields.map(f => `"${f}"`).join(', ');
  
  if (condition.exists) {
    // Update
    const updates = fields.map((f, i) => `"${f}" = $${i + 1}`).join(', ');
    const query = `UPDATE ${DB_SCHEMA}.${table} SET ${updates} WHERE ${condition.field} = $${fields.length + 1}`;
    await client.query(query, [...Object.values(data), condition.value]);
    return condition.id;
  } else {
    // Insert
    const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
    const query = `INSERT INTO ${DB_SCHEMA}.${table} (${fieldNames}) VALUES (${placeholders}) RETURNING id`;
    const { rows } = await client.query(query, Object.values(data));
    return rows[0].id;
  }
};

const checkMemberLoanCycle = async (url, data, branchcode, projectcode) => {
  try {
    const memberUrl = `${url}MemberList?BranchCode=${branchcode}&ProjectCode=${projectcode}&CONo=${data.pin}&OrgNo=${data.vo_code}&OrgMemNo=${data.orgmemno}&key=5d0a4a85-df7a-scapi-bits-93eb-145f6a9902ae&Status=2`;
    
    const memberData = await httpRequest(memberUrl);
    const members = typeof memberData === 'string' ? JSON.parse(memberData) : memberData;
    
    if (members.data?.length === 1) {
      const cycleNo = members.data[0].LoanCycleNo;
      if (cycleNo > 0) {
        return { loan_type: 'Repeat', brac_loancount: cycleNo };
      }
    }
  } catch (error) {
    logger.error('Member data fetch failed:', error);
  }
  return {};
};

// Main controller
exports.LoanRcaDataStore = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { json: dataset, token } = req.body;
    
    // Validation
    if (!validateToken(token)) {
      return res.json({ status: 'E', message: 'Token Invalid' });
    }
    
    if (!dataset?.loan?.[0] || !dataset?.rca?.[0]) {
      return res.json({ status: 'E', message: 'Invalid request structure' });
    }
    
    const data = dataset.loan[0];
    const dataRca = dataset.rca[0];
    
    if (!data.orgmemno) {
      return res.json({
        status: 'E',
        message: 'দয়া করে প্রথম পেজে সিঙ্ক করে তারপরে আবার ট্রাই করুন।'
      });
    }
    
    // Get server URL
    const serverResult = await getServerUrl(client);
    if (serverResult.error) {
      return res.json(serverResult.error);
    }
    
    const { url } = serverResult;
    const projectcode = padZero(data.project_code, 3);
    const branchcode = padZero(data.branch_code, 4);
    
    // Build loan data
    let loanData = buildLoanData(data, projectcode, branchcode);
    
    // Check member loan cycle
    const cycleData = await checkMemberLoanCycle(url, data, branchcode, projectcode);
    loanData = { ...loanData, ...cycleData };
    
    // Database transaction
    await client.query('BEGIN');
    
    try {
      // Check existing loan
      const checkQuery = `SELECT id FROM ${DB_SCHEMA}.loans WHERE loan_id = $1`;
      const { rows } = await client.query(checkQuery, [data.loan_id]);
      const exists = rows.length > 0;
      
      // Upsert loan
      const docId = await upsertData(client, 'loans', loanData, {
        exists,
        field: 'loan_id',
        value: data.loan_id,
        id: exists ? rows[0].id : null
      });
      
      // Upsert RCA
      const rcaData = buildRcaData(dataRca, docId);
      await upsertData(client, 'rca', rcaData, {
        exists,
        field: 'loan_id',
        value: docId,
        id: docId
      });
      
      await client.query('COMMIT');
      
      // Call document manager
      const baseUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:1001'
        : process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
        
      const documentUrl = `${baseUrl}/DocumentManager?doc_id=${docId}&projectcode=${projectcode}&doc_type=loan&pin=${data.pin}&role=0&branchcode=${branchcode}&action=Request`;
      
      const documentResponse = await httpRequest(documentUrl);
      const result = typeof documentResponse === 'string' ? JSON.parse(documentResponse) : documentResponse;
      
      if (result.status === 'S') {
        return res.json({
          status: "S",
          message: "অভিনন্দন! লোনের আবেদন সফলভাবে পাঠানো হয়েছে।\n•আবেদনের অবস্থান জানতে নোটিফিকেশন ও স্ট্যাটাস চেক করুন।"
        });
      }
      
      return res.json(result);
      
    } catch (dbError) {
      await client.query('ROLLBACK');
      throw dbError;
    }
    
  } catch (error) {
    logger.error('Controller error:', error);
    return res.json({ status: 'E', message: error.message });
  } finally {
    client.release();
  }
};