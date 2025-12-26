const express = require("express");
const router = express.Router();
const { validatePayment, sellerPending } = require("../../controller/Admin/payment.controller");
const auth = require("../../middleware/sesion");
const checkRol = require("../../middleware/rol");

router.get(
  "/admin/suscripciones/pending",
  auth,
  checkRol(["admin"]),
  sellerPending
);

router.put(
  "/admin/suscripciones/:suscripcionId/validate-payment",
  auth,
  checkRol(["admin"]), 
  validatePayment
);

module.exports = router;
