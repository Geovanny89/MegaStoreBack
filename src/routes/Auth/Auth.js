const express = require('express');
const { login, updateContraseña, forgotPassword, resetPassword, registerUser, registerSeller } = require('../../controller/Auth/auth.controller');
const { validateLogin, validatorRegisterUser, validatorRegisterSeller } = require('../../validators/auth');
const authMiddleware = require('../../middleware/sesion');
const multer = require('multer');
const storage = multer.memoryStorage(); // Guardar la imagen en memoria (puedes ajustar esto según tus necesidades)
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // Límite de 5MB por archivo para no saturar Cloudinary
});





const router = express.Router();

router.post('/register',validatorRegisterUser, registerUser)
router.post(
  '/register-seller',
  upload.fields([
    { name: "image", maxCount: 1 },    // Logo de la tienda
    { name: "document", maxCount: 1 }, // Foto de la cédula
    { name: "selfie", maxCount: 1 }   // Selfie con papel escrito
  ]), 
  validatorRegisterSeller, 
  registerSeller
);
router.post('/login', validateLogin,login)
router.put('/updateContrasenia',authMiddleware,updateContraseña)
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
module.exports=router   