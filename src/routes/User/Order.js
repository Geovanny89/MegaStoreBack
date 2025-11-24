const express = require("express");
const { createOrder, updateOrder, deleteOrder } = require("../../controller/User/order.controller");
const authMiddleware = require("../../middleware/sesion");

const router=express();

router.post('/order/:id',authMiddleware, createOrder)
router.put('/order/update/:id',authMiddleware,updateOrder)
router.delete('/order/delete/:id',authMiddleware,deleteOrder)


module.exports = router;