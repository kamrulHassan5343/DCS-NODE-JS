const { pool } = require('../config/config');
const logger = require('../utils/logger');

exports.BmLoanAssessment = async (req, res) => {
  const client = await pool.connect();

  try {
    const token = req.headers.apikey;
    const { loan_checklist: loanChecklist, rca } = req.body;

    if (token !== '7f30f4491cb4435984616d1913e88389') {
      return res.status(400).json({ status: 'E', message: 'Invalid token!' });
    }

    if (!loanChecklist || loanChecklist.length === 0) {
      return res.status(400).json({ status: 'E', message: 'Loan checklist data is required' });
    }

    const data = loanChecklist[0];
    const {
      project_code, branch_code, vo_code, erp_mem_id,
      loan_id, bm_quotationImg
    } = data;

    if (!loan_id) {
      return res.status(400).json({ status: 'E', message: 'Loan ID cannot be empty' });
    }

    await client.query('BEGIN');

    const loanResult = await client.query(
      `SELECT id, "quotation_paper_Image" FROM dcs.loans WHERE loan_id = $1`,
      [loan_id]
    );

    if (loanResult.rowCount === 0) {
      return res.status(404).json({ status: 'E', message: `Loan with ID '${loan_id}' not found.` });
    }

    const loan = loanResult.rows[0].id;
    const currentQuotationImage = loanResult.rows[0].quotation_paper_Image;
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Loan data
    const loanData = {
      bm_repay_loan: data.bm_repay_loan || null,
      bm_conduct_activity: data.bm_conduct_activity || null,
      bm_action_required: data.bm_action_required || null,
      bm_rca_rating: data.bm_rca_rating || null,
      bm_noofChild: data.bm_noofChild || null,
      bm_earningMember: data.bm_earningMember || null,
      bm_duration: data.bm_duration || null,
      bm_hometown: data.bm_hometown === 'Yes' ? 0 : 1,
      bm_landloard: data.bm_landloard === 'Yes' ? 0 : 1,
      bm_recomand: data.bm_recomand === 'Yes' ? 0 : 1,
      bm_occupation: data.bm_occupation === 'Yes' ? 0 : 1,
      bm_aware: data.bm_aware === 'Yes' ? 0 : 1,
      bm_grantor: data.bm_grantor === 'Yes' ? 0 : 1,
      bm_socialAcecptRating: data.bm_socialAcecptRating || null,
      bm_grantorRating: data.bm_grantorRating || null,
      bm_clienthouse: data.bm_clienthouse || null,
      bm_remarks: data.bm_remarks || null,
      approval_amount: data.approval_amount || null,
      quotation_paper_Image: bm_quotationImg || currentQuotationImage,
      update_at: now
    };

    const updateLoanQuery = `
      UPDATE dcs.loans 
      SET ${Object.keys(loanData).map((key, i) => `"${key}" = $${i + 1}`).join(', ')} 
      WHERE "loan_id" = $${Object.keys(loanData).length + 1}
    `;

    const updateLoanValues = [...Object.values(loanData), loan_id];
    await client.query(updateLoanQuery, updateLoanValues);

    // RCA update
    if (rca && rca.length > 0) {
      const r = rca[0];
      const rcaData = {
        bm_monthlyincome_main: r.bm_monthlyincome_main || null,
        bm_monthlyincome_spouse_child: r.bm_monthlyincome_spouse_child || null,
        bm_monthlyincome_other: r.bm_monthlyincome_other || null,
        bm_house_rent: r.bm_house_rent || null,
        bm_food: r.bm_food || null,
        bm_education: r.bm_education || null,
        bm_medical: r.bm_medical || null,
        bm_festive: r.bm_festive || null,
        bm_utility: r.bm_utility || null,
        bm_saving: r.bm_saving || null,
        bm_other: r.bm_other || null,
        bm_monthly_instal: r.bm_monthly_instal || null,
        bm_debt: r.bm_debt || null,
        bm_monthly_cash: r.bm_monthly_cash || null,
        bm_instal_proposloan: r.bm_instal_proposloan || null,
        bm_seasonal_income: r.bm_seasonal_income || null,
        bm_incomeformfixedassets: r.bm_incomeformfixedassets || null,
        bm_imcomeformsavings: r.bm_imcomeformsavings || null,
        bm_houseconstructioncost: r.bm_houseconstructioncost || null,
        bm_expendingonmarriage: r.bm_expendingonmarriage || null,
        bm_operation_childBirth: r.bm_operation_childBirth || null,
        bm_foreigntravel: r.bm_foreigntravel || null,
        bm_tolerance: r.bm_tolerance || null
      };

      const updateRcaQuery = `
        UPDATE dcs.rca 
        SET ${Object.keys(rcaData).map((key, i) => `"${key}" = $${i + 1}`).join(', ')} 
        WHERE "loan_id" = $${Object.keys(rcaData).length + 1}
      `;

      const updateRcaValues = [...Object.values(rcaData), loan];
      await client.query(updateRcaQuery, updateRcaValues);
    }

    await client.query('COMMIT');

    return res.json({
      status: "S",
      message: "Data saved successfully",
      loan_id: loan_id,
      timestamp: now
    });

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('BM Loan Assessment Error:', error.message);
    return res.status(500).json({ status: 'E', message: 'Internal server error' });
  } finally {
    client.release();
  }
};
