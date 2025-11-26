const express = require("express");
const { createOrder, updateOrder, deleteOrder, completeOrder } = require("../../controller/User/order.controller");
const authMiddleware = require("../../middleware/sesion");


const router=express();

router.post('/order',authMiddleware, createOrder)
router.put('/order/update/:id',authMiddleware,updateOrder)
router.delete('/order/delete/:id',authMiddleware,deleteOrder)
router.put('/order/complete/:id', authMiddleware, completeOrder);



module.exports = router;