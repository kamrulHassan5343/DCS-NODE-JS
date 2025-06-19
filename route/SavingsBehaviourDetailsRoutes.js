const router = require("express").Router(); 
const SavingsBehaviourController = require("../controller/SavingsBehaviourController"); 

router.get("/savings_behaviour_details", SavingsBehaviourController.GetSavingsBehaviourDetails); 

module.exports = router;
