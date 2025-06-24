const { pool } = require('../config/config');
const logger = require('../utils/logger');

exports.GetProfileUpdateData = async (req, res) => {
  const client = await pool.connect();
  try {
    const { branchcode, erp_member_id } = req.query;
    logger.info(`Profile Update Request: branchcode=${branchcode}, erp_member_id=${erp_member_id}`);

    // Get base member data
    const { rows } = await client.query(
      `SELECT * FROM dcs.admissions 
       WHERE branchcode = $1 AND "MemberId" = $2 AND erpstatus = 2 
       ORDER BY id DESC LIMIT 1`,
      [branchcode, erp_member_id]
    );

    if (!rows.length) {
      return res.status(400).json({
        status: 400,
        message: `এই মেম্বারের কোন প্রোফাইল আপডেট পাওয়া যায় নাই। ইআরপি মেম্বার আইডি-${erp_member_id} Okey প্রেস করে সামনে এগিয়ে যেতে পারবেন।`
      });
    }

    const member = rows[0];
    
    // Helper function to fetch additional data
    const fetchData = async (table, column, condition, params) => {
      const { rows } = await client.query(
        `SELECT ${column} FROM dcs.${table} WHERE ${condition} LIMIT 1`,
        params
      );
      return rows[0]?.[column] || null;
    };

    // Define all additional data to fetch
    const dataToFetch = [
      { key: 'MemberCateogry', table: 'projectwise_member_category', column: 'categoryname', condition: 'categoryid = $1', params: [member.membercateogryid] },
      { key: 'parmanentUpazila', table: 'office_mapping', column: 'thana_name', condition: 'thana_id = $1 AND district_id = $2', params: [member.parmanentupazilaid, member.permanentdistrictid] },
      { key: 'presentUpazila', table: 'office_mapping', column: 'thana_name', condition: 'thana_id = $1 AND district_id = $2', params: [member.presentupazilaid, member.presentdistrictid] },
      { key: 'mainidType', table: 'payload_data', column: 'data_name', condition: "data_type = 'cardTypeId' AND data_id = $1", params: [member.mainidtypeid] },
      { key: 'role_name', table: 'role_hierarchies', column: 'designation', condition: 'projectcode = $1 AND position = $2', params: [member.projectcode, member.roleid] },
      { key: 'reciverrole_name', table: 'role_hierarchies', column: 'designation', condition: 'projectcode = $1 AND position = $2', params: [member.projectcode, member.reciverrole] },
      { key: 'Comment', table: 'document_history', column: 'comment', condition: 'id = $1', params: [member.dochistory_id] },
      { key: 'Occupation', table: 'payload_data', column: 'data_name', condition: "data_type = 'occupationId' AND data_id = $1", params: [member.occupation] },
      { key: 'MaritalStatus', table: 'payload_data', column: 'data_name', condition: "data_type = 'maritalStatusId' AND data_id = $1", params: [member.maritalstatusid] },
      { key: 'SpuseOccupation', table: 'payload_data', column: 'data_name', condition: "data_type = 'occupationId' AND data_id = $1", params: [member.spuseoccupationid] },
      { key: 'Gender', table: 'payload_data', column: 'data_name', condition: "data_type = 'genderId' AND data_id = $1", params: [member.genderid] },
      { key: 'NomineeNidType', table: 'payload_data', column: 'data_name', condition: "data_type = 'cardTypeId' AND data_id = $1", params: [member.nomineenidtype] },
      { key: 'Relationship', table: 'payload_data', column: 'data_name', condition: "data_type = 'relationshipId' AND data_id = $1", params: [member.relationshipid] },
      { key: 'WalletOwner', table: 'payload_data', column: 'data_name', condition: "data_type = 'primaryEarner' AND data_id = $1", params: [member.walletowner] },
      { key: 'PrimaryEarner', table: 'payload_data', column: 'data_name', condition: "data_type = 'primaryEarner' AND data_id = $1", params: [member.primaryearner] }
    ];

    // Fetch all additional data in parallel
    const additionalData = await Promise.all(
      dataToFetch.map(async ({ key, ...query }) => ({
        key,
        value: await fetchData(query.table, query.column, query.condition, query.params)
      }))
    );

    // Add simple fields
    member.IsBkash = member.isbkash === '1' ? 'Yes' : 'No';
    member.IsSameAddress = member.issameaddress === '1' ? 'Yes' : 'No';
    member.rocketNo = member.roket_number;
    member.OccupationId = member.occupation;
    member.NomineeNidTypeId = member.nomineenidtype;
    member.PrimaryEarnerId = member.primaryearner;
    member.WalletOwnerId = member.walletowner;

    // Merge all data
    additionalData.forEach(({ key, value }) => {
      member[key] = value;
    });

    return res.status(200).json({ status: 200, data: member });

  } catch (err) {
    logger.error("GetProfileUpdateData error:", err);
    return res.status(500).json({ status: 500, message: "Server error." });
  } finally {
    client.release();
  }
};