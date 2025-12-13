const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer();

const authMiddleware = require("../../middleware/sesion");
const checkRol = require("../../middleware/rol");

const {
  getMyProducts,
  createSellerProduct,
  updateSellerProduct,
  deleteSellerProduct
} = require("../../controller/Seller/productos.vendedor.controller");

// Vendedor solo administra SUS productos
router.get("/seller/productos", authMiddleware, checkRol(["seller"]), getMyProducts);
router.post("/seller/productos", authMiddleware, checkRol(["seller"]), upload.array("image",5), createSellerProduct);
router.put("/seller/productos/:id", authMiddleware, checkRol(["seller"]),  upload.array("image",5),updateSellerProduct);
router.delete("/seller/productos/:id", authMiddleware, checkRol(["seller"]), deleteSellerProduct);

module.exports = router;
