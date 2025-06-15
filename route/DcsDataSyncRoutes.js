const router = require("express").Router(); 
const { dcsDataSync, 
} = require("../controller/DcsDataSyncController"); 

// Support both GET and POST requests
router.route("/DcsDataSync").post(dcsDataSync); 

module.exports = router; 