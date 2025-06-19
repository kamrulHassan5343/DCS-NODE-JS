const { pool } = require('../config/config');
const logger = require('../utils/logger');

exports.GetProfileUpdateData = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { branchcode, erp_member_id } = req.query;
    const db = 'dcs';

    logger.info(`Profile Update Request: branchcode=${branchcode}, erp_member_id=${erp_member_id}`);

    // Main admission data
    // const admissionQuery = `
    //   SELECT * FROM ${db}.admissions 
    //   WHERE branchcode = $1 AND MemberId = $2 AND erpstatus = 2 
    //   ORDER BY id DESC LIMIT 1
    // `;

    const admissionQuery = `
      SELECT * FROM dcs.admissions 
      WHERE branchcode = $1 AND "MemberId" = $2 AND erpstatus = 2 
      ORDER BY id DESC LIMIT 1
    `;



    const admissionResult = await client.query(admissionQuery, [branchcode, erp_member_id]);

    if (admissionResult.rows.length === 0) {
      return res.status(400).json({
        status: 400,
        data: "",
        message: `এই মেম্বারের কোন প্রোফাইল আপডেট পাওয়া যায় নাই। ইআরপি মেম্বার আইডি-${erp_member_id} Okey প্রেস করে সামনে এগিয়ে যেতে পারবেন।`
      });
    }

    let result = admissionResult.rows[0];

    // Helper function
    const getSingleValue = async (table, column, whereClause, params) => {
      const query = `SELECT ${column} FROM ${db}.${table} WHERE ${whereClause} LIMIT 1`;
      const data = await client.query(query, params);
      return data.rows[0]?.[column] || null;
    };

    result.MemberCateogry = await getSingleValue('projectwise_member_category', 'categoryname', 'categoryid = $1', [result.membercateogryid]);
    result.IsBkash = result.isbkash === '1' ? 'Yes' : 'No';
    result.parmanentUpazila = await getSingleValue('office_mapping', 'thana_name', 'thana_id = $1 AND district_id = $2', [result.parmanentupazilaid, result.permanentdistrictid]);
    result.presentUpazila = await getSingleValue('office_mapping', 'thana_name', 'thana_id = $1 AND district_id = $2', [result.presentupazilaid, result.presentdistrictid]);

    result.mainidType = await getSingleValue('payload_data', 'data_name', "data_type = 'cardTypeId' AND data_id = $1", [result.mainidtypeid]);
    result.role_name = await getSingleValue('role_hierarchies', 'designation', 'projectcode = $1 AND position = $2', [result.projectcode, result.roleid]);
    result.reciverrole_name = await getSingleValue('role_hierarchies', 'designation', 'projectcode = $1 AND position = $2', [result.projectcode, result.reciverrole]);
    result.Comment = await getSingleValue('document_history', 'comment', 'id = $1', [result.dochistory_id]);
    result.OccupationId = result.occupation;
    result.Occupation = await getSingleValue('payload_data', 'data_name', "data_type = 'occupationId' AND data_id = $1", [result.occupation]);
    result.MaritalStatus = await getSingleValue('payload_data', 'data_name', "data_type = 'maritalStatusId' AND data_id = $1", [result.maritalstatusid]);
    result.SpuseOccupation = await getSingleValue('payload_data', 'data_name', "data_type = 'occupationId' AND data_id = $1", [result.spuseoccupationid]);
    result.Gender = await getSingleValue('payload_data', 'data_name', "data_type = 'genderId' AND data_id = $1", [result.genderid]);
    result.NomineeNidTypeId = result.nomineenidtype;
    result.NomineeNidType = await getSingleValue('payload_data', 'data_name', "data_type = 'cardTypeId' AND data_id = $1", [result.nomineenidtype]);
    result.Relationship = await getSingleValue('payload_data', 'data_name', "data_type = 'relationshipId' AND data_id = $1", [result.relationshipid]);
    result.IsSameAddress = result.issameaddress === '1' ? 'Yes' : 'No';
    result.WalletOwnerId = result.walletowner;
    result.WalletOwner = await getSingleValue('payload_data', 'data_name', "data_type = 'primaryEarner' AND data_id = $1", [result.walletowner]);
    result.rocketNo = result.roket_number;
    result.PrimaryEarnerId = result.primaryearner;
    result.PrimaryEarner = await getSingleValue('payload_data', 'data_name', "data_type = 'primaryEarner' AND data_id = $1", [result.primaryearner]);

    return res.status(200).json({
      status: 200,
      data: result,
      message: ""
    });

  } catch (error) {
    logger.error("Error in GetProfileUpdateData:", error.message);
    return res.status(500).json({
      status: 500,
      data: "",
      message: "Server error while fetching profile update data."
    });
  } finally {
    client.release();
  }
};
