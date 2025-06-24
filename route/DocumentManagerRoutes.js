const router = require("express").Router(); 
const DocumentManagerController = require("../controller/DocumentManagerController"); 

router.post("/document_manager",DocumentManagerController.document_manager); 


router.post("/DocumentManager",DocumentManagerController.DocumentManager); 



module.exports = router;
