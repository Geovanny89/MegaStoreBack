const express = require("express");
const router = express.Router();
const auth = require("../../middleware/sesion");
const checkRol = require("../../middleware/rol");
const multer = require('multer');
const storage = multer.memoryStorage(); // Guardar la imagen en memoria (puedes ajustar esto según tus necesidades)
const upload = multer({ storage: storage });
const { retryIdentity } = require("../../controller/Seller/verificacion.controller");

router.put(
  "/seller/retry-identity",
  auth,
  checkRol(["seller"]),
  upload.fields([
    { name: "idDocumentFront", maxCount: 1 },
    { name: "selfieWithPaper", maxCount: 1 }
  ]),
  retryIdentity
);

module.exports = router;
