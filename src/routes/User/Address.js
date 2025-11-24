const express = require("express");
const router = express.Router();
const auth = require("../../middleware/sesion");

const {
  agregarDireccion,
  editarDireccion,
  eliminarDireccion,
  setDefaultAddress,
  obtenerDirecciones
} = require("../../controller/User/address.controller");

// Crear
router.post("/user/createAdress", auth, agregarDireccion);

// Editar
router.put("/user/address/:addressId", auth, editarDireccion);

// Eliminar
router.delete("/user/address/:addressId", auth, eliminarDireccion);

// Establecer como predeterminada
router.put("/user/address/default/:addressId", auth, setDefaultAddress);

// Listar direcciones
router.get("/user/address", auth, obtenerDirecciones);

module.exports = router;
