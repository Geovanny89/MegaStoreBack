const express = require("express");
const { vendedor, vendedorById } = require("../../controller/User/vendedor.controller");

const router = express.Router();

router.get("/vendedor/all", vendedor);
router.get("/vendedor/:id",vendedorById)

module.exports = router;