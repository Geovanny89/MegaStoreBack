const express = require('express');
const {allTipesProductos,createTipeProduct,  tipeProductName,updateTipeName, deleteTipe} = require('../../controller/Admin/tipoProductos.controller');
const authMiddleware = require('../../middleware/sesion');
const checkRol = require('../../middleware/rol');
const router = express();

router.get('/all/tipes',authMiddleware, allTipesProductos);
router.get('/tipe/:name',authMiddleware,tipeProductName)
router.post('/createTipe',authMiddleware,checkRol(["admin","seller"]),createTipeProduct);
router.put('/update/tipe/:id',authMiddleware,checkRol(["admin","seller"]),updateTipeName)
router.delete('/delete/tipe/:id',authMiddleware,checkRol(["admin","seller"]), deleteTipe)


module.exports = router;