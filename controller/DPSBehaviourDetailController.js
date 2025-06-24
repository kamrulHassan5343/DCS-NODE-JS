const axios = require('axios');
const { pool } = require('../config/config');
const logger = require('../utils/logger');

const getServerUrl = async () => {
  try {
    const { rows } = await pool.query(
      `SELECT url FROM dcs.server_url 
       WHERE server_status = 3 AND status = 1 
       LIMIT 1`
    );
    return rows[0]?.url || null;
  } catch (err) {
    logger.error('Failed to get server URL:', err.message);
    return null;
  }
};

exports.GetDPSBehaviourDetail = async (req, res) => {
  try {
    const { branchcode, projectcode, MemberId, AccountNo, orgno, orgmemno } = req.query;

    // Validate required parameters
    if (!AccountNo) {
      return res.status(400).json({ 
        status: 'E', 
        message: 'AccountNo is required' 
      });
    }

    if (!MemberId && (!orgno || !orgmemno)) {
      return res.status(400).json({ 
        status: 'E', 
        message: 'Either MemberId or both orgno and orgmemno must be provided' 
      });
    }

    // Get server URL
    const url = await getServerUrl();
    if (!url) {
      return res.status(500).json({ 
        status: 'E', 
        message: 'Service unavailable' 
      });
    }

    // Build API parameters
    const params = new URLSearchParams({
      ProjectCode: projectcode || '',
      BranchCode: branchcode || '',
      AccountNo,
      key: '5d0a4a85-df7a-scapi-bits-93eb-145f6a9902ae',
      ...(orgno && orgmemno ? { OrgNo: orgno, OrgMemNo: orgmemno } : { MemberId })
    });

    const apiUrl = `${url}DPSBehavior?${params}`;
    logger.info(`Calling DPS API: ${apiUrl}`);

    // Make API call
    const response = await axios.get(apiUrl);
    return res.json(response.data);

  } catch (error) {
    logger.error('DPS API Error:', error.message);
    return res.status(500).json({ 
      status: 'E', 
      message: 'Internal server error' 
    });
  }
};