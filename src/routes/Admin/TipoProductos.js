const express = require('express');
const {allTipesProductos,createTipeProduct,  tipeProductName,updateTipeName, deleteTipe, tiposPorCategoriaTienda} = require('../../controller/Admin/tipoProductos.controller');
const authMiddleware = require('../../middleware/sesion');
const checkRol = require('../../middleware/rol');
const router = express();

router.get('/all/tipes', allTipesProductos);
router.get('/seller/tipos-productos',authMiddleware,tiposPorCategoriaTienda);
router.get('/tipe/:name',authMiddleware,tipeProductName)
router.post('/createTipe',authMiddleware,checkRol(["admin"]),createTipeProduct);
router.put('/update/tipe/:id',authMiddleware,checkRol(["admin"]),updateTipeName)
router.delete('/delete/tipe/:id',authMiddleware,checkRol(["admin"]), deleteTipe)


module.exports = router;