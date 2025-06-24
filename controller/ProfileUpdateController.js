const { pool } = require('../config/config');
const logger = require('../utils/logger');

exports.GetProfileUpdateData = async (req, res) => {
  const client = await pool.connect();
  try {
    const { branchcode, erp_member_id } = req.query;

    logger.info(`📥 Profile Update Request: branchcode=${branchcode}, erp_member_id=${erp_member_id}`);

    const query = `
      SELECT * FROM dcs.admissions 
      WHERE branchcode = $1 AND "MemberId" = $2 AND erpstatus = 2 
      ORDER BY id DESC LIMIT 1
    `;

    const result = await client.query(query, [branchcode, erp_member_id]);
    if (result.rows.length === 0) {
      return res.status(400).json({
        status: 400,
        data: "",
        message: `এই মেম্বারের কোন প্রোফাইল আপডেট পাওয়া যায় নাই। ইআরপি মেম্বার আইডি-${erp_member_id} Okey প্রেস করে সামনে এগিয়ে যেতে পারবেন।`
      });
    }

    const row = result.rows[0];

    // Helper to fetch single value
    const getValue = async (table, column, where, params) => {
      const q = `SELECT ${column} FROM dcs.${table} WHERE ${where} LIMIT 1`;
      const r = await client.query(q, params);
      return r.rows[0]?.[column] || null;
    };

    // Enrich response
    const enrichments = {
      MemberCateogry: getValue('projectwise_member_category', 'categoryname', 'categoryid = $1', [row.membercateogryid]),
      IsBkash: row.isbkash === '1' ? 'Yes' : 'No',
      parmanentUpazila: getValue('office_mapping', 'thana_name', 'thana_id = $1 AND district_id = $2', [row.parmanentupazilaid, row.permanentdistrictid]),
      presentUpazila: getValue('office_mapping', 'thana_name', 'thana_id = $1 AND district_id = $2', [row.presentupazilaid, row.presentdistrictid]),
      mainidType: getValue('payload_data', 'data_name', "data_type = 'cardTypeId' AND data_id = $1", [row.mainidtypeid]),
      role_name: getValue('role_hierarchies', 'designation', 'projectcode = $1 AND position = $2', [row.projectcode, row.roleid]),
      reciverrole_name: getValue('role_hierarchies', 'designation', 'projectcode = $1 AND position = $2', [row.projectcode, row.reciverrole]),
      Comment: getValue('document_history', 'comment', 'id = $1', [row.dochistory_id]),
      OccupationId: row.occupation,
      Occupation: getValue('payload_data', 'data_name', "data_type = 'occupationId' AND data_id = $1", [row.occupation]),
      MaritalStatus: getValue('payload_data', 'data_name', "data_type = 'maritalStatusId' AND data_id = $1", [row.maritalstatusid]),
      SpuseOccupation: getValue('payload_data', 'data_name', "data_type = 'occupationId' AND data_id = $1", [row.spuseoccupationid]),
      Gender: getValue('payload_data', 'data_name', "data_type = 'genderId' AND data_id = $1", [row.genderid]),
      NomineeNidTypeId: row.nomineenidtype,
      NomineeNidType: getValue('payload_data', 'data_name', "data_type = 'cardTypeId' AND data_id = $1", [row.nomineenidtype]),
      Relationship: getValue('payload_data', 'data_name', "data_type = 'relationshipId' AND data_id = $1", [row.relationshipid]),
      IsSameAddress: row.issameaddress === '1' ? 'Yes' : 'No',
      WalletOwnerId: row.walletowner,
      WalletOwner: getValue('payload_data', 'data_name', "data_type = 'primaryEarner' AND data_id = $1", [row.walletowner]),
      rocketNo: row.roket_number,
      PrimaryEarnerId: row.primaryearner,
      PrimaryEarner: getValue('payload_data', 'data_name', "data_type = 'primaryEarner' AND data_id = $1", [row.primaryearner])
    };

    // Resolve all async enrichment values
    const enriched = await Promise.all(
      Object.entries(enrichments).map(async ([key, val]) => [key, await val])
    );

    // Build final response object
    for (const [key, val] of enriched) {
      row[key] = val;
    }

    return res.status(200).json({ status: 200, data: row, message: "" });

  } catch (err) {
    logger.error("❌ GetProfileUpdateData error:", err.message);
    return res.status(500).json({ status: 500, data: "", message: "Server error." });
  } finally {
    client.release();
  }
};
