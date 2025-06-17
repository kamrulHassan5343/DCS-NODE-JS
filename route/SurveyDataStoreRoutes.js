const router = require("express").Router(); 
const SurveyDataStoreController = require("../controller/SurveyDataStoreController"); 

router.post(
    "/survey_data_store", 
    SurveyDataStoreController.validateSurveyData,
    SurveyDataStoreController.SurveyDataStore
); 

module.exports = router;