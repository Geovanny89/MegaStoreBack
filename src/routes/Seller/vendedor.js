const express = require('express');
const {
  getPerfilVendedor,
  updatePerfilVendedor
} = require('../../controller/Seller/vendedor.controller');

const authMiddleware = require('../../middleware/sesion');
const checkRol = require('../../middleware/rol');

const router = express.Router();

router.get('/vendedor/perfil', authMiddleware, checkRol(["seller"]), getPerfilVendedor);
router.put('/vendedor/update', authMiddleware, checkRol(["seller"]), updatePerfilVendedor);

module.exports = router;
