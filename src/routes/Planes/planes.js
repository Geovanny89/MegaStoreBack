const express = require("express");
const router = express.Router();
const { getPlanesActivos } = require("../../controller/Planes/planesContoller");

router.get("/user/planes", getPlanesActivos);

module.exports = router;
