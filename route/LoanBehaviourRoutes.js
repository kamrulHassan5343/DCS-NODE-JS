const router = require("express").Router(); 
const LoanBehaviourController = require("../controller/LoanBehaviourController"); 

router.get("/loan_behaviour_list", LoanBehaviourController.GetLoanBehaviour); 

module.exports = router;
