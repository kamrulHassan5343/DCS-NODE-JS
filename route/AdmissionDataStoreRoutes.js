const express = require('express');
const router = express.Router();
const AdmissionStoreController = require('../controller/AdmissionStoreController');

router.post('/admission_store', AdmissionStoreController.admissionStore);

module.exports = router;