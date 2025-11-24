const express = require('express');
const { register, login } = require('../../controller/Auth/auth.controller');
const { validateRegister, validateLogin } = require('../../validators/auth');

const router= express();

router.post('/register',validateRegister, register)
router.post('/login', validateLogin,login)

module.exports=router