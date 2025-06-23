const express = require('express');
const router = express.Router();
const NidVerificationController = require('../controller/NidVerificationController'); // Fixed path

router.post('/nid-verification', NidVerificationController.verifyNid);

module.exports = router;
