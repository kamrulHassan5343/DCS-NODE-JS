const { pool } = require('../config/config');
const logger = require('../utils/logger');

const VALID_TOKEN = '7f30f4491cb4435984616d1913e88389';

exports.bmAdmissionAssessment = async (req, res) => {
  try {
    const { token, admission } = req.body;

    // Validate request
    if (!token || !admission || !admission[0]) {
      return res.status(400).json({ status: 'E', message: 'Missing required data' });
    }

    if (token !== VALID_TOKEN) {
      return res.status(400).json({ status: 'E', message: 'Invalid token' });
    }

    const data = admission[0];
    const assessmentData = {
      bm_behavior: data.behavior,
      bm_financial_status: data.financial_status,
      bm_client_house_image: data.client_house_image,
      bm_lat: data.lat,
      bm_lng: data.lng,
      updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Update record - try by entollmentid first, then by MemberId
      let result;
      if (data.mem_id) {
        result = await client.query(
          `UPDATE dcs.admissions 
           SET bm_behavior = $1, bm_financial_status = $2, bm_client_house_image = $3, 
               bm_lat = $4, bm_lng = $5, updated_at = $6 
           WHERE entollmentid = $7`,
          [assessmentData.bm_behavior, assessmentData.bm_financial_status, 
           assessmentData.bm_client_house_image, assessmentData.bm_lat, 
           assessmentData.bm_lng, assessmentData.updated_at, data.mem_id]
        );
      } else if (data.erp_mem_id) {
        result = await client.query(
          `UPDATE dcs.admissions 
           SET bm_behavior = $1, bm_financial_status = $2, bm_client_house_image = $3, 
               bm_lat = $4, bm_lng = $5, updated_at = $6 
           WHERE "MemberId" = $7`,
          [assessmentData.bm_behavior, assessmentData.bm_financial_status, 
           assessmentData.bm_client_house_image, assessmentData.bm_lat, 
           assessmentData.bm_lng, assessmentData.updated_at, data.erp_mem_id]
        );
      } else {
        await client.query('ROLLBACK');
        return res.status(400).json({ status: 'E', message: 'Missing member identifier' });
      }

      if (result.rowCount > 0) {
        await client.query('COMMIT');
        logger.info('BM assessment updated successfully');
        return res.json({ status: 'S', message: 'Assessment saved successfully' });
      } else {
        await client.query('ROLLBACK');
        return res.status(404).json({ status: 'E', message: 'Member record not found' });
      }

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('BM assessment error:', error.message);
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    logger.error('BM assessment request error:', error.message);
    return res.status(500).json({ status: 'E', message: error.message });
  }
};

module.exports = {
  bmAdmissionAssessment: exports.bmAdmissionAssessment
};