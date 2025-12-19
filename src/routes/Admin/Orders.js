const express = require("express");
const router = express.Router();
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });

const authMiddleware = require("../../middleware/sesion");
const checkRol = require("../../middleware/rol");

const {
  getSellerOrders,
  markOrderProcessing,
  markOrderShipped,
  confirmPayment,
  rejectPayment,
} = require("../../controller/Admin/order.controller");
const { uploadPaymentProof } = require("../../controller/User/order.controller");

/* ============================================================
   RUTAS PARA VENDEDOR
   ============================================================ */

// Obtener todas las órdenes del vendedor
router.get(
  "/seller/orders",
  authMiddleware,
  checkRol(["seller"]), 
  getSellerOrders
);

// Marcar orden como "processing"
router.put(
  "/seller/orders/:orderId/processing",
  authMiddleware,
  checkRol(["seller"]),
  markOrderProcessing
);

// Marcar orden como "shipped"
router.put(
  "/seller/orders/:orderId/shipped",
  authMiddleware,
  checkRol(["seller"]),
  markOrderShipped
);

/* ============================================================
   RUTAS PARA COMPRADOR
   ============================================================ */

// Confirmar pago
router.put(
  "/seller/orders/:orderId/confirm-payment",
  authMiddleware,
  checkRol(["seller", "admin"]),
  confirmPayment
);

// Rechazar pago (fraude)
router.put(
  "/seller/orders/:orderId/reject-payment",
  authMiddleware,
  checkRol(["seller", "admin"]),
  rejectPayment
);
router.put(
  "/buyer/orders/:orderId/payment-proof",
  authMiddleware,
  upload.single("image"),
  uploadPaymentProof
);

module.exports = router;
