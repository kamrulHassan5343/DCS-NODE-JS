const express = require('express');
const router = express.Router();
const AdmissionController = require('../controller/AdmissionStoreController'); // Note: consistent naming
const { validateHeaders } = require('../middlewares/headerValidation');
const { validateAdmissionRequest } = require('../middlewares/requestValidation');

// Instantiate the controller
const admissionController = new AdmissionController();

router.post(
    '/admission_store',
    express.json(), // For parsing application/json
    validateHeaders, // Header validation middleware
    validateAdmissionRequest, // Request body validation
    admissionController.handleAdmissionStore.bind(admissionController) // Proper binding
);

module.exports = router;