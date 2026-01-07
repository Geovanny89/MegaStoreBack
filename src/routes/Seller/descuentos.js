const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middleware/sesion");
const checkRol = require("../../middleware/rol");

const {
  createDescuento,
  updateDescuento,
  deleteDescuento,
  toggleDescuento,
  getMyDescuentos
} = require("../../controller/Seller/descuentos/descuentos.controller");

/* =====================================================
   DESCUENTOS / CAMPAÑAS (VENDEDOR)
===================================================== */

// Crear campaña
router.post("/descuentos", authMiddleware,checkRol(["seller"]), createDescuento);

// Listar campañas del vendedor
router.get("/descuentos", authMiddleware,checkRol(["seller"]), getMyDescuentos);

// Actualizar campaña
router.put("/descuentos/:id", authMiddleware,checkRol(["seller"]), updateDescuento);

// Eliminar campaña
router.delete("/descuentos/:id", authMiddleware,checkRol(["seller"]), deleteDescuento);

// Activar / Desactivar campaña
router.patch("/descuentos/:id/estado", authMiddleware, toggleDescuento);

module.exports = router;
