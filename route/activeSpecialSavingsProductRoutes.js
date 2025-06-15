const router = require("express").Router(); 
const { 
  getActiveSpecialProduct, 
} = require("../controller/activeSpecialSavingsProductController"); 

// Support both GET and POST requests
router.route("/activeSpecialSavingsProducts")
  // .get(getActiveSpecialProduct)
  .post(getActiveSpecialProduct); 

module.exports = router; 