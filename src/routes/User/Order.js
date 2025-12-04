const express = require("express");
const { createOrder,  getMyOrders } = require("../../controller/User/order.controller");
const authMiddleware = require("../../middleware/sesion");


const router=express();

router.get("/order/my-orders", authMiddleware, getMyOrders);
router.post('/order',authMiddleware, createOrder)



module.exports = router;