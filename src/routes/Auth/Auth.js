const express = require('express');
const { login, updateContraseña, forgotPassword, resetPassword, registerUser, registerSeller } = require('../../controller/Auth/auth.controller');
const { validateLogin, validatorRegisterUser, validatorRegisterSeller } = require('../../validators/auth');
const authMiddleware = require('../../middleware/sesion');
const multer = require('multer');
const storage = multer.memoryStorage(); // Guardar la imagen en memoria (puedes ajustar esto según tus necesidades)
const upload = multer({ storage: storage });






const router = express.Router();

router.post('/register',validatorRegisterUser, registerUser)
router.post('/register-seller',upload.single("image"), validatorRegisterSeller,registerSeller)
router.post('/login', validateLogin,login)
router.put('/updateContrasenia',authMiddleware,updateContraseña)
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
module.exports=router  