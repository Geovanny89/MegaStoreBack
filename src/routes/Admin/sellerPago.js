const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middleware/sesion");
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

const {
  uploadPaymentProof,
  getSellerMe
} = require("../../controller/Admin/sellerPayment.controller");
const checkRol = require("../../middleware/rol");

router.put(
  "/seller/payment-proof",
  authMiddleware,
  checkRol(["seller"]),
  upload.single("proof"),
  uploadPaymentProof
);
router.get(
  "/seller/me",
  authMiddleware,
  checkRol(["seller"]),
  getSellerMe 
);


module.exports = router;
