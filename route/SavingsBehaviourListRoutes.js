const router = require("express").Router(); 
const SavingsBehaviourController = require("../controller/SavingsBehaviourController"); 

router.get("/savings_behaviour_list", SavingsBehaviourController.GetSavingsBehaviourList); 

module.exports = router;
