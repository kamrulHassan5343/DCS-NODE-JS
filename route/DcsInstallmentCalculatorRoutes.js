// const router = require("express").Router(); 
// const DcsInstallmentCalculatorController = require("../controller/DcsInstallmentCalculatorController"); 

// router.post("/dcs_installment_calculator", DcsInstallmentCalculatorController.postDcsInstallmentCalculator); 

// module.exports = router;
const router = require("express").Router();
const { validationResult } = require('express-validator');
const DcsInstallmentCalculatorController = require("../controller/DcsInstallmentCalculatorController");

router.post(
    "/dcs_installment_calculator",
    DcsInstallmentCalculatorController.getValidationRules(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                status: "E", 
                message: errors.array().map(e => e.msg).join('\n') 
            });
        }
        next();
    },
    (req, res) => new DcsInstallmentCalculatorController().calculate(req, res)
);

module.exports = router;