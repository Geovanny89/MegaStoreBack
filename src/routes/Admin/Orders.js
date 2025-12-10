const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middleware/sesion");
const checkRol = require("../../middleware/rol");

const {
  getSellerOrders,
  markOrderProcessing,
  markOrderShipped,
  markOrderDelivered,
} = require("../../controller/Admin/order.controller");

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

// Confirmar entrega de la orden ("delivered")
router.put(
  "/buyer/orders/:orderId/delivered",
  authMiddleware,
  checkRol(["user"]),
  markOrderDelivered
);

module.exports = router;
