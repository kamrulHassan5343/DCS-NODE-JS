// Load environment variables
require('dotenv').config({ path: `${process.cwd()}/.env` });

const express = require('express');
const app = express();

// Import Routes
const authRoute = require('./route/authRoute');

// const activeSpecialSavingsProductsRoutes = require('./route/activeSpecialSavingsProductRoutes');
const DcsDataSyncRoutes = require('./route/DcsDataSyncRoutes');
const admissionDataStoreRoutes = require('./route/AdmissionDataStoreRoutes');
const LoanRcaDataStoreRoutes = require('./route/LoanRcaDataStoreRoutes');
const DocumentManagerRoutes = require('./route/DocumentManagerRoutes');

const dcsInstallmentCalculatorRoutes = require('./route/dcsInstallmentCalculatorRoutes');
const dcsInsurancePremiumCalculationRoutes = require('./route/DcsInsurancePremiumCalculationRoutes');
const BmAdmissionAssessmentRoutes =  require('./route/BmAdmissionAssessmentRoutes');
const BmLoanAssessmentRoutes = require('./route/BmLoanAssessmentRoutes');
const SurveyDataStoreRoutes = require('./route/SurveyDataStoreRoutes');
const ProfileUpdateRoutes = require('./route/ProfileUpdateRoutes');
const erp_member_listRoutes = require('./route/ErpMemberListRoutes');

// loan_behaviour

const LoanBehaviourRoutes = require('./route/LoanBehaviourRoutes');
const LoanBehaviourDetailRoutes = require('./route/LoanBehaviourDetailRoutes');

const SavingsBehaviourListRoutes = require('./route/SavingsBehaviourListRoutes');
const SavingsBehaviourDetailRoutes = require('./route/SavingsBehaviourDetailsRoutes');

const DPSBehaviourDetailRoutes = require('./route/DPSBehaviourDetailRoutes');


// Import Error Handling Utilities
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controller/errorController');

// Middlewares

// Middleware to parse JSON with larger limit
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));



// Mount Routes
app.use('/api/auth', authRoute);

// app.use('/api', activeSpecialSavingsProductsRoutes); // for /activeSpecialSavingsProducts
app.use('/api', DcsDataSyncRoutes); // for /DcsDataSync
app.use('/api', admissionDataStoreRoutes); // for /admissionDataStore
app.use('/api', LoanRcaDataStoreRoutes); // for /LoanRcaDataStore
app.use('/api', DocumentManagerRoutes); // for /DocumentManager
app.use("/api",dcsInstallmentCalculatorRoutes);
app.use("/api",dcsInsurancePremiumCalculationRoutes);
app.use("/api",BmAdmissionAssessmentRoutes);
app.use("/api",BmLoanAssessmentRoutes);
app.use("/api",SurveyDataStoreRoutes);
app.use("/api",ProfileUpdateRoutes);
app.use("/api", erp_member_listRoutes); // for /erp_member_list
app.use("/api", LoanBehaviourRoutes); // for /loan_behaviour_list
app.use("/api", LoanBehaviourDetailRoutes); // for /loan_behaviour_details
app.use("/api", SavingsBehaviourListRoutes); // for /savings_behaviour_list
app.use("/api", SavingsBehaviourDetailRoutes); // for /savings_behaviour_details
app.use("/api", DPSBehaviourDetailRoutes); // for /dps_behaviour_details




// Handle undefined routes
// app.all('*', (req, res, next) => {
//     next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
// });


app.all("*", (req, res, next) => {
  res.status(404).json({
    status: "fail",
    message: `Can't find ${req.originalUrl} on this server`
  });
});


// Global error handler
app.use(globalErrorHandler);

// Start server
const PORT = process.env.APP_PORT || 8000;
app.listen(PORT, () => {
    console.log(`✅ Server up and running on port ${PORT}`);
});

module.exports = app;
