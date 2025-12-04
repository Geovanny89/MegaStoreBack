const express = require("express");


const {allTipesProductosUser, tipesId} = require('../../controller/User/tipes.controller')
const router = express.Router(); // ← ESTE ES EL FIX

router.get('/user/categorias',allTipesProductosUser)
router.get('/user/categori/:id',tipesId)

module.exports = router;