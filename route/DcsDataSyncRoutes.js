const router = require("express").Router();
const { dcsDataSync, validationRules } = require("../controller/DcsDataSyncController");

// Route supports both JSON response and ZIP download
// Use ?download=zip query parameter or Accept: application/zip header for ZIP download
router.route("/DcsDataSync").post(validationRules, dcsDataSync);

// Test endpoint to check if route is working
router.get("/test", (req, res) => {
    res.json({ 
        status: "success", 
        message: "Route is working", 
        timestamp: new Date().toISOString() 
    });
});


module.exports = router;