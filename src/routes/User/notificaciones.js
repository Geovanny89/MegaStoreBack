const express = require("express");
const authMiddleware = require("../../middleware/sesion");
const {
  getNotificationsByUser,
  markNotificationRead,
} = require("../../controller/User/notificaciones.user.controller");

const router = express.Router();

// Obtener notificaciones del usuario logueado
router.get("/user/notifications", authMiddleware, getNotificationsByUser);

// Marcar notificación como leída
router.put("/user/notifications/:id/read", authMiddleware, markNotificationRead);

module.exports = router;
