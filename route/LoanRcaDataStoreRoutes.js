const router = require("express").Router(); 
const ApiControllerVersion = require("../controller/LoanStoreController"); 

router.post("/loan_rca_store", ApiControllerVersion.LoanRcaDataStore); 

module.exports = router;
