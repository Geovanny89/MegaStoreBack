const express = require('express')
const productos = require('./Admin/Productos')
const tipoProductos = require('./Admin/TipoProductos')
const allUser = require('./Admin/User')
const UserProducts = require('./User/Products')
const register = require('./Auth/Auth')
const users = require('./User/Users')
const orderUser = require('./User/Order')
const banner = require('./Admin/Banner')
const categories = require('./User/TipeProducts')
const carrito = require('./User/Carrito')
const favorite= require('./User/favoritos')
const address = require('./User/Address')
const question= require('./Questions/productQuestionRoutes')
const suscripciones = require('./User/suscripciones')
const planes = require('./Planes/planes')   


const router = express();

router.use(productos)
router.use(tipoProductos)
router.use(allUser)
router.use(UserProducts)
router.use(register)
router.use(users)
router.use(orderUser)
router.use(banner)
router.use(categories)
router.use(carrito)
router.use(favorite)
router.use(address)
router.use(question)
router.use(suscripciones)
router.use(planes)



module.exports = router;