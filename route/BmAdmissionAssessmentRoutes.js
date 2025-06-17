const router = require("express").Router(); 
const ApiControllerVersion = require("../controller/ApiControllerVersion"); 

router.post("/bm_admission_assessment", ApiControllerVersion.bmAdmissionAssessment); 

module.exports = router;
