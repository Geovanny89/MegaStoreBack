const express = require("express");
const router = express.Router();
const { validatePayment, sellerPending, getPendingIdentity, approveIdentity } = require("../../controller/Admin/payment.controller");
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
router.get(
  "/admin/vendedores/identidad-pendiente", 
  auth, 
  checkRol(["admin"]), 
  getPendingIdentity // Trae los usuarios con isVerified: false
);

router.put(
  "/admin/vendedores/:userId/aprobar-identidad", 
  auth, 
  checkRol(["admin"]), 
  approveIdentity // Cambia isVerified a true
);


module.exports = router;
