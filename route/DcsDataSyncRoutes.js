// const router = require("express").Router(); 
// const { dcsDataSync, 
// } = require("../controller/DcsDataSyncController"); 

// // Support both GET and POST requests
// router.route("/DcsDataSync").post(dcsDataSync); 

// module.exports = router; 

const router = require("express").Router();
const compression = require('compression');
const { dcsDataSync } = require("../controller/DcsDataSyncController");

// Compression middleware configuration
const compressionConfig = compression({
    level: 6, // Compression level (0-9, where 9 is maximum compression)
    threshold: 1024, // Only compress responses larger than 1KB
    filter: (req, res) => {
        // Only compress JSON responses
        if (res.getHeader('Content-Type') && res.getHeader('Content-Type').includes('application/json')) {
            return true;
        }
        return compression.filter(req, res);
    }
});

// Apply compression middleware to the specific route
router.route("/DcsDataSync").post(compressionConfig, dcsDataSync);

module.exports = router;