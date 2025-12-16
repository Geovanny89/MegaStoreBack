const express = require("express");
const { createOrder,  getMyOrders, markOrderReceived } = require("../../controller/User/order.controller");
const authMiddleware = require("../../middleware/sesion");


const router=express();

router.get("/order/my-orders", authMiddleware, getMyOrders);
router.post('/order',authMiddleware, createOrder)
router.put(
  "/orders/:orderId/received",
  authMiddleware,
  markOrderReceived
);



module.exports = router;