const axios = require('axios');
const moment = require('moment');
const { pool } = require('../config/config'); // Assuming you have this config file
const logger = require('../utils/logger'); // Assuming you have this logger utility





exports.bmAdmissionAssessment = async (req, res) => {
  try {
    const dataset = req.body;

    if (!dataset || !dataset.token || !dataset.admission) {
      return res.status(400).json({ status: 'E', message: 'Missing JSON payload' });
    }

    const token = dataset.token;
    const data = dataset.admission[0];

    logger.info(`Bm Assessment Admission Data: ${JSON.stringify(dataset)}`);

    if (token !== '7f30f4491cb4435984616d1913e88389') {
      logger.info('Bm Admission Assessment Invalid Token.');
      return res.status(400).json({ status: 'E', message: 'Invalid token!' });
    }

    const dbSchema = 'dcs';
    const projectcode = data.project_code.toString().padStart(3, '0');
    const branchcode = data.branch_code.toString().padStart(4, '0');
    const orgno = data.vo_code;
    const pin = data.pin;
    const entollmentid = data.mem_id;
    const MemberId = data.erp_mem_id;
    const bm_behavior = data.behavior;
    const bm_financial_status = data.financial_status;
    const bm_client_house_image = data.client_house_image;
    const bm_lat = data.lat;
    const bm_lng = data.lng;
    const updatedAt = moment().format('YYYY-MM-DD HH:mm:ss');

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      let result;
      if (entollmentid) {
        result = await client.query(
          `UPDATE ${dbSchema}.admissions 
           SET bm_behavior = $1, bm_financial_status = $2, bm_client_house_image = $3, 
               bm_lat = $4, bm_lng = $5, update_at = $6 
           WHERE entollmentid = $7`,
          [bm_behavior, bm_financial_status, bm_client_house_image, bm_lat, bm_lng, updatedAt, entollmentid]
        );
      } else {
        result = await client.query(
          `UPDATE ${dbSchema}.admissions 
           SET bm_behavior = $1, bm_financial_status = $2, bm_client_house_image = $3, 
               bm_lat = $4, bm_lng = $5, update_at = $6 
           WHERE "MemberId" = $7`,
          [bm_behavior, bm_financial_status, bm_client_house_image, bm_lat, bm_lng, updatedAt, MemberId]
        );
      }

      if (result.rowCount > 0) {
        await client.query('COMMIT');
        logger.info('Bm Admission Assessment Successful.');
        return res.json({ status: 'S', message: 'Data saved' });
      } else {
        await client.query('ROLLBACK');
        return res.status(404).json({ status: 'E', message: 'No matching record found' });
      }
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error('Bm Admission Assessment Exception:', err.message);
      return res.status(500).json({ status: 'E', message: err.message });
    } finally {
      client.release();
    }
  } catch (err) {
    logger.error('JSON Parse Error:', err.message);
    return res.status(400).json({ status: 'E', message: 'Invalid JSON format' });
  }
};
