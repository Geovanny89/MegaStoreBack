const express = require('express');
const { register, login, updateContraseña } = require('../../controller/Auth/auth.controller');
const { validateRegister, validateLogin } = require('../../validators/auth');
const authMiddleware = require('../../middleware/sesion');

const router= express();

router.post('/register',validateRegister, register)
router.post('/login', validateLogin,login)
router.put('/updateContrasenia',authMiddleware,updateContraseña)
module.exports=router 