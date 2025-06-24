const router = require("express").Router(); 
const BmAdmissionAssessmentController = require("../controller/BmAdmissionAssessmentController"); 

router.post("/bm_admission_assessment", BmAdmissionAssessmentController.bmAdmissionAssessment); 

module.exports = router;
