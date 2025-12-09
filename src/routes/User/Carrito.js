const express = require("express");
const {agregarProductoAlCarrito, deleteProductoCarrito, verProductosEnCarrito} = require('../../controller/User/carrito')
const authMiddleware = require("../../middleware/sesion");

const router=express();

router.get('/user/carAll',authMiddleware,verProductosEnCarrito)
router.post('/user/car',authMiddleware, agregarProductoAlCarrito)
router.delete('/user/car/delete/:id', authMiddleware,deleteProductoCarrito)



module.exports = router;