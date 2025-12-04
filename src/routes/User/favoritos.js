const express = require("express");
const router = express.Router();
const auth = require("../../middleware/sesion");

const {
  AgregarFavorito,
  EliminarFavorito,
  verFavoritos
} = require("../../controller/User/favorites.controller");

router.post("/favorite/:productId", auth, AgregarFavorito);
router.delete("/favoriteDelete/:productId", auth, EliminarFavorito);
router.get("/favorito/all", verFavoritos);
module.exports = router;
