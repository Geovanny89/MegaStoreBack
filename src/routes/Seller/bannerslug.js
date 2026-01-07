const express = require("express");
const router = express.Router();

const { getStorefront } = require(
  "../../controller/Seller/StoreBanner/bannerPrivado.controller"
);

// Ruta pública de la tienda
router.get("/banner/:slug", getStorefront);

module.exports = router;
