const router = require("express").Router(); 
const DcsInsurancePremiumCalculationController = require("../controller/DcsInsurancePremiumCalculationController"); 

router.post("/dcs_installment_premium_calculator", DcsInsurancePremiumCalculationController.postDcsInstallmentPremiumCalculator); 

module.exports = router;
