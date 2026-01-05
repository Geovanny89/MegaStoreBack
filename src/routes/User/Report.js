const express = require("express");
const router = express.Router();
const auth = require("../../middleware/sesion");
const { reportSeller } = require("../../controller/User/report.controller");

router.post("/report/seller/:sellerId", auth, reportSeller);

module.exports = router;