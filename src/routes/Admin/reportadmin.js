const express = require("express");
const router = express.Router();
const auth = require("../../middleware/sesion");
const checkRol = require("../../middleware/rol");
const {
  getAllReports,
  reviewReport,
  dismissReport,
  reactivateSeller
} = require("../../controller/Admin/reportadmin.controller");


router.get("/admin/reports", auth,checkRol(["admin"]), getAllReports);
router.put("/admin/reports/:reportId/review", auth,checkRol(["admin"]), reviewReport);
router.put("/admin/reports/:reportId/dismiss", auth,checkRol(["admin"]),  dismissReport);
router.put("/admin/seller/:sellerId/reactivate", auth,checkRol(["admin"]),  reactivateSeller);

module.exports = router;
