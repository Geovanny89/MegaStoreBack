const express = require('express');
const router = express.Router();
const { crearSuscripcion } = require('../../controller/User/suscripciones.controller');
const authMiddleware = require('../../middleware/sesion');


// POST /api/suscripciones
router.post('/create/suscripcion',authMiddleware,  crearSuscripcion);


module.exports = router;
