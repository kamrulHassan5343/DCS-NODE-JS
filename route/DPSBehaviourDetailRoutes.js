const router = require("express").Router(); 
const DPSBehaviourDetailController = require("../controller/DPSBehaviourDetailController"); 

router.get("/dps_behaviour_details", DPSBehaviourDetailController.GetDPSBehaviourDetail); 

module.exports = router;
