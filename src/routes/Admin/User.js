const express = require('express');
const { allUser, updateUser, deleteUser } = require('../../controller/Admin/user.controller');
const authMiddleware = require('../../middleware/sesion');
const checkRol = require('../../middleware/rol');

const router = express();

router.get('/all/admin/user',authMiddleware,checkRol(["admin"]),allUser)
router.put('/user/admin/update/:id',authMiddleware,checkRol(["admin"]),updateUser)
router.delete('/user/admin/delete/:id',authMiddleware,checkRol(["admin"]), deleteUser)


module.exports = router;
