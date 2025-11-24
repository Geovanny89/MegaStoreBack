const express = require('express');
const { updateUser, deleteUser } = require('../../controller/User/user.controller');
const authMiddleware = require('../../middleware/sesion');

const router = express();

router.put('/user/update/:id',authMiddleware,updateUser)
router.delete('/user/delete/:id',authMiddleware,deleteUser)

module.exports=router