const express = require("express");
const {agregarProductoAlCarrito, deleteProductoCarrito, verProductosEnCarrito} = require('../../controller/User/carrito')
const authMiddleware = require("../../middleware/sesion");

const router=express();

router.get('/car/all',authMiddleware,verProductosEnCarrito)
router.post('/car',authMiddleware, agregarProductoAlCarrito)
router.delete('/car/delete/:id', authMiddleware,deleteProductoCarrito)



module.exports = router;