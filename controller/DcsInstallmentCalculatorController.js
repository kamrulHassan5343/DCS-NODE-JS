
const axios = require("axios");
const { pool } = require("../config/config");
const logger = require("../utils/logger");


exports.postDcsInstallmentCalculator = async (req, res) => {

    res.send({
        status: "success",
        message: "DCS Insurance  Calculation API is working",
        data: {
            premiumAmount: 1000, // Example value
            installmentAmount: 200 // Example value
        }
    });
}
