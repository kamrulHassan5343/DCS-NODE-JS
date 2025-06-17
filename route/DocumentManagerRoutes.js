const router = require("express").Router(); 
const ApiControllerVersion = require("../controller/ApiControllerVersion"); 

router.post("/document_manager",ApiControllerVersion.document_manager); 

module.exports = router;
