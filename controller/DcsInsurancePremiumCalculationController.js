const axios = require("axios");
const { pool } = require("../config/config");
const logger = require("../utils/logger");

exports.postDcsInstallmentPremiumCalculator = async (req, res) => {
  logger.info("Premium Cal : " + JSON.stringify(req.body));

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

  const validationErrors = validateRequest(req.body);
  if (validationErrors) {
    return res.status(400).json({ status: "E", message: validationErrors });
  }

  try {
    const insuranceProductId = await getInsuranceProductId(
      projectCode,
      loanProductCode
    );

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

    logger.info("Request Premium Calculation: " + JSON.stringify(payload));

    const serverUrls = await getServerUrls();
    if (!serverUrls) {
      logger.warn("No server URLs found in database, using fallback URL");
      return res.status(500).json({ status: "E", message: "Server URL not configured" });
    }

    const token = await getToken();
    if (!token) {
      return res.json({ status: "CUSTMSG", message: "Token Not Found" });
    }

    logger.info("Using Token (short): Bearer " + token.substring(0, 20) + "...");

    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "apikey": "7f30f4491cb4435984616d1913e88389",
      "appid": "bmfpo",
      "appversioncode": "120"
    };

    const response = await axios.post(serverUrls[0], payload, { headers });

    const result = response.data || {};

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

    logger.info("Premium Calculation Response: " + JSON.stringify(premiumResponse));
    return res.json(premiumResponse);

  } catch (err) {
    logger.error("Error in premium calculation: " + err.message);
    if (err.response && err.response.data) {
      logger.error("API Response Error: " + JSON.stringify(err.response.data));
      return res.status(err.response.status).json({
        status: "E",
        message: err.response.data?.message || err.message,
        trace: err.response.data
      });
    }
    return res.status(500).json({ status: "E", message: err.message });
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
  if (data.policyType && !/^[a-zA-Z0-9]+$/.test(data.policyType)) {
    errors.push("policyType must be alphanumeric");
  }
  if (data.proposalDurationInMonths && !Number.isInteger(data.proposalDurationInMonths)) {
    errors.push("proposalDurationInMonths must be an integer");
  }
  if (data.proposedLoanAmount && !Number.isInteger(data.proposedLoanAmount)) {
    errors.push("proposedLoanAmount must be an integer");
  }
  return errors.length > 0 ? errors.join("\n") : null;
}

async function getInsuranceProductId(projectCode, productcode) {
  let id = 33; // Default fallback
  if (projectCode === '15') {
    id = productcode === 'BD-10103' ? 25 : productcode === 'BD-10113' ? 26 : 33;
  } else if (projectCode === '279') {
    id = productcode === 'BD-10103' ? 29 : productcode === 'BD-10113' ? 22 : 34;
  } else if (projectCode === '104') {
    id = productcode === 'BD-10103' ? 27 : productcode === 'BD-10113' ? 28 : 36;
  } else if (projectCode === '351') {
    id = productcode === 'BD-10103' ? 23 : productcode === 'BD-10113' ? 24 : 35;
  } else {
    id = null;
  }
  return id;
}

async function getServerUrls() {
  try {
    const { rows } = await pool.query(
      `SELECT url, url2 FROM dcs.server_url WHERE server_status = 3 AND status = 1 LIMIT 1`
    );
    if (rows.length === 0) return null;
    return [rows[0].url, rows[0].url2];
  } catch (error) {
    logger.error("getServerUrls error: " + error.message);
    return null;
  }
}

async function getToken() {
  try {
    const tokenResponse = await axios.post(
      'https://bracapitesting.brac.net/oauth/v2/token?grant_type=client_credentials',
      {},
      {
        headers: {
          'x-client-id': 'Ieg1N5W2qh3hF0qS9Zh2wq6eex2DB935',
          'x-client-secret': '4H2QJ89kYQBStaCuY73h'
        }
      }
    );

    logger.info("Fresh Token Response: " + JSON.stringify(tokenResponse.data));

    return tokenResponse.data?.access_token || null;
  } catch (error) {
    logger.error("Token fetch error: " + error.message);
    return null;
  }
}
