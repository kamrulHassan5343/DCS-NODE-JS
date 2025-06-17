const router = require("express").Router(); 
const BmLoanAssessmentController = require("../controller/BmLoanAssessmentController"); 

router.post("/bm_loan_assessment", BmLoanAssessmentController.BmLoanAssessment); 

module.exports = router;
