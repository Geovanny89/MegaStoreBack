const express = require("express");
const router = express.Router();
const auth = require("../../middleware/sesion");
const checkRol = require("../../middleware/rol");
const { getSellerDashboard } = require("../../controller/Seller/dashboard/dashboard.controller");

router.get(
  "/seller/dashboard",
  auth,
  checkRol(["seller"]),
  getSellerDashboard
);

module.exports = router;
