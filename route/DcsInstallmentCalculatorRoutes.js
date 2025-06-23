const router = require("express").Router(); 
const DcsInstallmentCalculatorController = require("../controller/DcsInstallmentCalculatorController"); 

router.post("/dcs_installment_calculator", DcsInstallmentCalculatorController.postDcsInstallmentCalculator); 

module.exports = router;
