const router = require("express").Router(); 
const LoanBehaviourController = require("../controller/LoanBehaviourController"); 

router.get("/loan_behaviour_details", LoanBehaviourController.GetLoanBehaviourDetails); 

module.exports = router;
