const express = require('express');
const router = express.Router();

const { createBanner, updateBanner, deleteBanner, getBanner } = require('../../controller/Admin/banner.controller');
const multer = require('multer');
const authMiddleware = require('../../middleware/sesion');
const checkRol = require('../../middleware/rol');
const storage = multer.memoryStorage(); // Guardar la imagen en memoria (puedes ajustar esto según tus necesidades)
const upload = multer({ storage: storage });

// Rutas para la gestión de banners
router.get('/banners/all', getBanner);
router.post('/banners',authMiddleware,checkRol(["admin"]), upload.single('image'), createBanner);
router.put('/banners/:id',authMiddleware,checkRol(["admin"]), upload.single('image'), updateBanner);
router.delete('/banners/:id',authMiddleware,checkRol(["admin"]), deleteBanner);

module.exports = router;
