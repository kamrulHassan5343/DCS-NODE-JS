const router = require("express").Router();
const { dcsDataSync, validationRules } = require("../controller/DcsDataSyncController");

// Route supports both JSON response and ZIP download
// Use ?download=zip query parameter or Accept: application/zip header for ZIP download
router.route("/DcsDataSync").post(validationRules, dcsDataSync);

// Test endpoint to check if route is working


module.exports = router;