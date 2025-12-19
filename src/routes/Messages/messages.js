const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middleware/sesion");
const {
  getOrderMessages,
  sendMessage
} = require("../../controller/Messages/messageController");

router.get(
  "/orders/:orderId/messages",
  authMiddleware,
  getOrderMessages
);

router.post(
  "/orders/:orderId/messagess",
  authMiddleware,
  sendMessage
);

module.exports = router;
