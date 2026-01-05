const express = require("express");
const router = express.Router();
const { submitIdentity } = require("../../controller/Seller/submitIdentity.controller");
// const { retryIdentity } = require("../../controllers/seller/retryIdentity");
const authMiddleware = require("../../middleware/sesion");
const checkRol = require('../../middleware/rol');
const multer = require('multer');
const storage = multer.memoryStorage(); // Guardar la imagen en memoria (puedes ajustar esto según tus necesidades)
const upload = multer({ storage: storage });

// Primer envío
router.post(
  "/seller/submit-identity",
  authMiddleware,
  checkRol(["seller"]),
  upload.fields([
    { name: "idDocumentFront", maxCount: 1 },
    { name: "selfieWithPaper", maxCount: 1 }
  ]),
  submitIdentity
);

// Reenvío tras rechazo
// router.post(
//   "/seller/retry-identity",
//   authMiddleware,
//   upload.fields([
//     { name: "idDocumentFront", maxCount: 1 },
//     { name: "selfieWithPaper", maxCount: 1 }
//   ]),
//   retryIdentity
// );

module.exports = router;
