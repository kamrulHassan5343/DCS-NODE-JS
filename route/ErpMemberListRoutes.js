const express = require("express");
const router = express.Router();
const ErpMemberListController = require("../controller/ErpMemberListController");
router.use(express.urlencoded({ extended: true }));

router.get("/erp_member_list", ErpMemberListController.GetErpMemberListData);


module.exports = router;