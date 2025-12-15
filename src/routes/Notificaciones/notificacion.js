const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middleware/sesion");
const {
  getNotifications,
  markAsRead
} = require("../../controller/Notificaciones/notificacion.controller");

router.get("/seller/notificacion", authMiddleware, getNotifications);
router.patch("/seller/notificacion/:id/read", authMiddleware, markAsRead);

module.exports = router;
