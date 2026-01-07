const express = require("express");
const router = express.Router();
const multer = require("multer");

const authMiddleware = require("../../middleware/sesion");
const checkRol = require("../../middleware/rol");

const {
  crearBanner,
  listarMisBanners,
  toggleBanner,
  eliminarBanner
} = require("../../controller/Seller/StoreBanner/storeBanner.controller");

/* ================= MULTER ================= */
const storage = multer.memoryStorage();
const upload = multer({ storage });

/* ================= RUTAS SELLER ================= */

// Crear banner (1 imagen)
router.post(
  "/create/banners",
  authMiddleware,
  checkRol(["seller"]),
  upload.single("image"),
  crearBanner
);

// Listar banners del vendedor (panel)
router.get(
  "/seller/allBanners",
  authMiddleware,
  checkRol(["seller"]),
  listarMisBanners
);

// Activar / Desactivar banner
router.patch(
  "/:id/toggle",
  authMiddleware,
  checkRol(["seller"]),
  toggleBanner
);

// Eliminar banner (borra Cloudinary)
router.delete(
  "/:id/banners",
  authMiddleware,
  checkRol(["seller"]),
  eliminarBanner
);

module.exports = router;
