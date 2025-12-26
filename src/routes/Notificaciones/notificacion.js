const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middleware/sesion");

const {
  getUserNotifications,
  markAsRead,
  getSellerNotifications
} = require("../../controller/Notificaciones/notificacion.controller");

/* ===================== USUARIO ===================== */
router.get(
  "/notifications/user",
  authMiddleware,
  getUserNotifications
);


/* ===================== MARCAR COMO LEÍDA ===================== */
router.patch(
  "/notifications/:id/read",
  authMiddleware,
  markAsRead
);
router.get(
  "/notifications/seller",
  authMiddleware,
  getSellerNotifications
);


module.exports = router;

// /* ===================== TIENDA ===================== */
// router.get(
  //   "/notifications/store/:slug",
  //   authMiddleware,
  //   getStoreNotifications
  // );
  // getStoreNotifications,