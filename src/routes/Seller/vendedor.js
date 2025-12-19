const express = require('express');
const {
  getPerfilVendedor,
  updatePerfilVendedor
} = require('../../controller/Seller/vendedor.controller');
const multer = require('multer');
const storage = multer.memoryStorage(); // Guardar la imagen en memoria (puedes ajustar esto según tus necesidades)
const upload = multer({ storage: storage });


const authMiddleware = require('../../middleware/sesion');
const checkRol = require('../../middleware/rol');

const router = express.Router();

router.get('/vendedor/perfil', authMiddleware, checkRol(["seller"]), getPerfilVendedor);
router.put('/vendedor/update', authMiddleware, checkRol(["seller"]),upload.fields([{ name: "nequiQR", maxCount: 1 },{ name: "daviplataQR", maxCount: 1 }
  ]), updatePerfilVendedor);
 
module.exports = router;
