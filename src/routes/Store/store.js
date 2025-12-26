const express = require("express");
const router = express.Router();
const { getStoreBySlug } = require("../../controller/Store/storeController");

// Esta ruta será: GET /api/store/nombre-de-la-tienda
router.get("/store/:slug", getStoreBySlug);

module.exports = router;