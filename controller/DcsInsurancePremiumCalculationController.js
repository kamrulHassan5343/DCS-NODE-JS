
const axios = require("axios");
const { pool } = require("../config/config");
const logger = require("../utils/logger");

exports.postDcsInstallmentPremiumCalculator = async (req, res) => {
  logger.info("Premium Cal: " + JSON.stringify(req.body));

  try {
    // Validation
    const validationError = validateRequest(req.body);
    if (validationError) {
      return res.json({ status: "E", message: validationError });
    }

    const {
      projectCode,
      loanProductCode,
      policyType,
      proposalDurationInMonths,
      proposedLoanAmount,
      memberDob,
      insurerDob,
      branchCode,
    } = req.body;

    // Get insurance product ID
    const insuranceProductId = getInsuranceProductId(projectCode, loanProductCode);
    if (!insuranceProductId) {
      return res.json({ status: "E", message: "Invalid project/product combination" });
    }

    // Get server URL
    const serverUrl = await getServerUrl();
    if (!serverUrl) {
      return res.json({ status: "E", message: "Server URL not configured" });
    }

    // Get token
    const token = await getToken();
    if (!token) {
      return res.json({ status: "CUSTMSG", message: "Token Not Found" });
    }

    // Prepare request
    const payload = {
      branchCode,
      projectCode,
      loanProductCode,
      policyType,
      proposalDurationInMonths,
      proposedLoanAmount,
      insuranceProductId,
      memberDateOfBirth: memberDob,
      insurerDateOfBirth: insurerDob,
    };

    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "apikey": "7f30f4491cb4435984616d1913e88389",
      "appid": "bmfpo",
      "appversioncode": "120"
    };

    // Make API call
    const response = await axios.post(serverUrl, payload, { headers });
    const result = response.data || {};

    // Return response
    const premiumResponse = {
      status: response.status,
      projectCode: result.projectCode || "",
      loanProductCode: result.loanProductCode || "",
      policyType: result.policyType || "",
      proposalDurationInMonths: result.proposalDurationInMonths || "",
      proposedLoanAmount: result.proposedLoanAmount || "",
      insuranceProductId: result.insuranceProductId || "",
      premiumAmount: result.premiumAmount || "",
    };

    logger.info("Premium Response: " + JSON.stringify(premiumResponse));
    return res.json(premiumResponse);

  } catch (error) {
    logger.error("Premium calculation error: " + error.message);
    
    if (error.response) {
      return res.json({
        status: "E",
        message: error.response.data?.message || error.message
      });
    }
    
    return res.json({ status: "E", message: error.message });
  }
};

function validateRequest(data) {
  const errors = [];
  
  if (data.projectCode && data.projectCode.length > 3) {
    errors.push("projectCode max length is 3");
  }
  if (data.loanProductCode && typeof data.loanProductCode !== "string") {
    errors.push("loanProductCode must be a string");
  }
  if (data.proposalDurationInMonths && !Number.isInteger(data.proposalDurationInMonths)) {
    errors.push("proposalDurationInMonths must be an integer");
  }
  if (data.proposedLoanAmount && !Number.isInteger(data.proposedLoanAmount)) {
    errors.push("proposedLoanAmount must be an integer");
  }
  
  return errors.length > 0 ? errors.join(", ") : null;
}

function getInsuranceProductId(projectCode, productcode) {
  const mapping = {
    '15': { 'BD-10103': 25, 'BD-10113': 26, default: 33 },
    '279': { 'BD-10103': 29, 'BD-10113': 22, default: 34 },
    '104': { 'BD-10103': 27, 'BD-10113': 28, default: 36 },
    '351': { 'BD-10103': 23, 'BD-10113': 24, default: 35 }
  };
  
  const project = mapping[projectCode];
  return project ? (project[productcode] || project.default) : null;
}

async function getServerUrl() {
  try {
    const { rows } = await pool.query(
      `SELECT url FROM dcs.server_url WHERE server_status = 3 AND status = 1 LIMIT 1`
    );
    return rows.length > 0 ? rows[0].url : null;
  } catch (error) {
    logger.error("getServerUrl error: " + error.message);
    return null;
  }
}

async function getToken() {
  try {
    const response = await axios.post(
      'https://bracapitesting.brac.net/oauth/v2/token?grant_type=client_credentials',
      {},
      {
        headers: {
          'x-client-id': 'Ieg1N5W2qh3hF0qS9Zh2wq6eex2DB935',
          'x-client-secret': '4H2QJ89kYQBStaCuY73h'
        }
      }
    );
    
    return response.data?.access_token || null;
  } catch (error) {
    logger.error("Token fetch error: " + error.message);
    return null;
  }
}