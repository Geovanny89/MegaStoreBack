const express = require("express");
const { productoUser, productxName, productId } = require("../../controller/User/producto.controller");

const router = express();

router.get('/user/allProducts', productoUser)
router.get('/user/product/:name', productxName)
router.get('user/product/:id',productId)

module.exports = router