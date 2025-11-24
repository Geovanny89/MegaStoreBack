const express = require('express');
const {allProduct,createProduct, productName, updateProduct, deleteProduct, getProductId} = require('../../controller/Admin/productos.controller');
const authMiddleware = require('../../middleware/sesion');
const checkRol = require('../../middleware/rol');
const multer = require('multer');
const storage = multer.memoryStorage(); // Guardar la imagen en memoria (puedes ajustar esto según tus necesidades)
const upload = multer({ storage: storage });
const router = express();


router.get('/allProduct',authMiddleware,checkRol(["admin"]),allProduct);
router.get('/:name',authMiddleware,checkRol(["admin"]),productName);
router.get('/product/:id',getProductId)
router.post('/create', authMiddleware, upload.array('image', 7), checkRol(["admin"]), createProduct);
router.put('/update/:id',authMiddleware,checkRol(["admin"]),updateProduct)
router.delete('/delete/:id',authMiddleware,checkRol(["admin"]),deleteProduct)


module.exports = router