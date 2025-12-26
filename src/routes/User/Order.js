const express = require("express");
const { createOrder,  getMyOrders, markOrderReceived, getMyOrdersByStore } = require("../../controller/User/order.controller");
const authMiddleware = require("../../middleware/sesion");
const checkRol = require('../../middleware/rol');


const router=express();

router.get("/order/my-orders", authMiddleware, getMyOrders);
router.post('/order',authMiddleware, createOrder)
router.put(
  "/orders/:orderId/received",
  authMiddleware,
  markOrderReceived
);
// GET /orders/store/:slug
router.get(
  "/order/my-orders/store/:slug",
  authMiddleware,
  checkRol(["user"]),
  getMyOrdersByStore
);




module.exports = router;