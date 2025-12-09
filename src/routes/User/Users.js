const express = require('express');
const { updateUser, deleteUser, getUserById } = require('../../controller/User/user.controller');
const authMiddleware = require('../../middleware/sesion');

const router = express();
router.get("/user/user", authMiddleware, getUserById);
router.put('/user/update',authMiddleware,updateUser)
router.delete('/user/delete',authMiddleware,deleteUser)

module.exports=router