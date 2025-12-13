const express = require('express');
const { register, login, updateContraseña, forgotPassword, resetPassword } = require('../../controller/Auth/auth.controller');
const { validateRegister, validateLogin } = require('../../validators/auth');
const authMiddleware = require('../../middleware/sesion');
const multer = require('multer');
const storage = multer.memoryStorage(); // Guardar la imagen en memoria (puedes ajustar esto según tus necesidades)
const upload = multer({ storage: storage });






const router = express.Router();

router.post('/register',upload.single("image"),validateRegister, register)
router.post('/login', validateLogin,login)
router.put('/updateContrasenia',authMiddleware,updateContraseña)
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
module.exports=router  