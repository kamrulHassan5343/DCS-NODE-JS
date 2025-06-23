const express = require('express');
const router = express.Router();
const SavingsTransactionController = require('../controller/SavingsTransactionController');

router.get('/savingsTransaction', SavingsTransactionController.Savings_Transaction);

module.exports = router;