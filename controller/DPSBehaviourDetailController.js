const axios = require("axios");
const { pool } = require("../config/config");
const logger = require("../utils/logger");

// 🧠 Helper to get server URLs
const getServerUrl = async () => {
  try {
    const result = await pool.query(
      `SELECT * FROM dcs.server_url WHERE server_status = 3 AND status = 1 LIMIT 1`
    );

    if (result.rows.length === 0) {
      return { error: true, message: "Api Url Not Found" };
    }

    const server = result.rows[0];
    if (server.maintenance_status === "1") {
      return { error: true, message: server.maintenance_message };
    }

    return { error: false, urls: [server.url, server.url2] };
  } catch (err) {
    logger.error("Database error:", err.message);
    return { error: true, message: "Database error while fetching server URL." };
  }
};

// ✅ Controller
exports.GetDPSBehaviourDetail = async (req, res, next) => {
  try {
    const { branchcode, projectcode, MemberId, AccountNo, orgno, orgmemno } = req.query;

    // 🔍 Validation
    const errors = [];
    if (branchcode && branchcode.length > 4) errors.push("branchcode must be max 4 characters");
    if (projectcode && projectcode.length > 3) errors.push("projectcode must be max 3 characters");
    if (orgno && orgno.length > 4) errors.push("orgno must be max 4 characters");
    if (orgmemno && orgmemno.length > 10) errors.push("orgmemno must be max 10 characters");
    if (!AccountNo) errors.push("AccountNo is required");
    if (!MemberId && (!orgno || !orgmemno)) errors.push("Either MemberId or both orgno and orgmemno must be provided");

    if (errors.length > 0) {
      return res.status(400).json({ status: "E", message: errors.join("\n") });
    }

    // 🌐 Get Server URL
    const serverResponse = await getServerUrl();
    if (serverResponse.error) {
      return res.status(500).json({ status: "CUSTMSG", message: serverResponse.message });
    }

    const [url] = serverResponse.urls;
    const key = "5d0a4a85-df7a-scapi-bits-93eb-145f6a9902ae";

    // 🔧 Build Query
    const whereQuery = orgno && orgmemno
      ? `OrgNo=${orgno}&OrgMemNo=${orgmemno}`
      : `MemberId=${MemberId}`;

    const apiUrl = `${url}DPSBehavior?ProjectCode=${projectcode}&BranchCode=${branchcode}&AccountNo=${AccountNo}&key=${key}&${whereQuery}`;
    logger.info("Calling DPS API:", apiUrl);

    const response = await axios.get(apiUrl);
    return res.status(200).json({
      code: 200,
      data: response.data,
      message: null
    });

  } catch (error) {
    logger.error("DPS API Error:", error.message);
    return res.status(500).json({ status: "E", message: "Server error occurred." });
  }
};


// exports. GetDPSBehaviourDetail = async (req, res, next) => {
//  res.send("Hello from GetDPSBehaviourDetail!");
// };
