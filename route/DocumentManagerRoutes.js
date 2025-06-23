const router = require("express").Router(); 
const DocumentManagerController = require("../controller/DocumentManagerController"); 
const ApiControllerVersion = require("../controller/ApiControllerVersion");

router.post("/DocumentManager",DocumentManagerController.DocumentManager); 

router.post("/document_manager",ApiControllerVersion.document_manager); 


module.exports = router;
