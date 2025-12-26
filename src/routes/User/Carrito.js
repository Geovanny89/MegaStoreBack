const express = require("express");
const {agregarProductoAlCarrito, deleteProductoCarrito, verProductosEnCarrito, verCarritoPorTienda} = require('../../controller/User/carrito')
const authMiddleware = require("../../middleware/sesion");

const router=express();

router.get('/user/carAll',authMiddleware,verProductosEnCarrito)
router.post('/user/car',authMiddleware, agregarProductoAlCarrito)
router.delete('/user/car/delete/:id', authMiddleware,deleteProductoCarrito)
router.get("/user/car/tienda/:slug",authMiddleware,verCarritoPorTienda);



module.exports = router; 