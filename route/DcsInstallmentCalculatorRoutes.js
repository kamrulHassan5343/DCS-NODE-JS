const router = require("express").Router(); 
const ApiControllerVersion = require("../controller/ApiControllerVersion"); 

router.post("/dcs_installment_calculator", ApiControllerVersion.postDcsInstallmentCalculator); 

module.exports = router;
