const router = require("express").Router(); 
const ProfileUpdateController = require("../controller/ProfileUpdateController"); 

router.get("/profile_update", ProfileUpdateController.GetProfileUpdateData); 

module.exports = router;
