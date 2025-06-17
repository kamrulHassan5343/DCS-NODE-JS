const router = require("express").Router(); 
const ApiControllerVersion = require("../controller/ApiControllerVersion"); 

router.post("/loan_tore", ApiControllerVersion.LoanRcaDataStore); 

module.exports = router;
