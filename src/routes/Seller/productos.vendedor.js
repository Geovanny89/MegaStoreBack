// const express = require("express");
// const router = express.Router();
// const multer = require("multer");
// const upload = multer();

// const authMiddleware = require("../../middleware/sesion");
// const checkRol = require("../../middleware/rol");

// const {
//   getMyProducts,
//   createSellerProduct,
//   updateSellerProduct,
//   deleteSellerProduct
// } = require("../../controller/Seller/productos.vendedor.controller");
// const { sellerActiveMiddleware } = require("../../middleware/sellerActiveMiddleware");

// // Vendedor solo administra SUS productos
// router.get("/seller/productos", authMiddleware, checkRol(["seller"]), getMyProducts);
// router.post("/seller/productos", authMiddleware,sellerActiveMiddleware, checkRol(["seller"]), upload.array("image",5), createSellerProduct);
// router.put("/seller/productos/:id", authMiddleware,sellerActiveMiddleware, checkRol(["seller"]),  upload.array("image",5),updateSellerProduct);
// router.delete("/seller/productos/:id", authMiddleware,sellerActiveMiddleware, checkRol(["seller"]), deleteSellerProduct);

// module.exports = router;
const express = require("express");
const router = express.Router();
const multer = require("multer");

// Configuración básica de multer en memoria
const storage = multer.memoryStorage();
const upload = multer({ 
    storage,
    limits: { files: 5 } // Límite de 5 archivos
});

// FUNCIÓN PARA CAPTURAR EL ERROR DE MULTER
// Esta función envuelve a multer para que, si hay error, responda con JSON y no con HTML 500
const uploadWithCustomError = (req, res, next) => {
    const uploadAction = upload.array("image", 5);

    uploadAction(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // Si el error es porque subió más de 5
            if (err.code === "LIMIT_FILE_COUNT") {
                return res.status(400).json({ message: "Solo puedes subir un máximo de 5 imágenes" });
            }
            // Otros errores de multer (archivo muy grande, etc)
            return res.status(400).json({ message: `Error de subida: ${err.message}` });
        } else if (err) {
            return res.status(500).json({ message: "Error interno al procesar imágenes" });
        }
        // Si no hay error, pasamos al controlador (createSellerProduct)
        next();
    });
};

const authMiddleware = require("../../middleware/sesion");
const checkRol = require("../../middleware/rol");
const {
  getMyProducts,
  createSellerProduct,
  updateSellerProduct,
  deleteSellerProduct
} = require("../../controller/Seller/productos.vendedor.controller");
const { sellerActiveMiddleware } = require("../../middleware/sellerActiveMiddleware");
const requireSellerVerified = require("../../middleware/requireSellerVerified");

// RUTAS ACTUALIZADAS
router.get("/seller/productos", authMiddleware, checkRol(["seller"]), getMyProducts);

// Reemplazamos upload.array("image", 5) por nuestra función uploadWithCustomError
router.post(
    "/seller/productos", 
    authMiddleware, 
    checkRol(["seller"]),
    requireSellerVerified, 
    sellerActiveMiddleware, 
    uploadWithCustomError, // <--- CAMBIO AQUÍ
    createSellerProduct
);

router.put(
    "/seller/productos/:id", 
    authMiddleware, 
    checkRol(["seller"]), 
    requireSellerVerified,
    sellerActiveMiddleware, 
    uploadWithCustomError, // <--- CAMBIO AQUÍ
    updateSellerProduct
);

router.delete("/seller/productos/:id", authMiddleware, sellerActiveMiddleware, checkRol(["seller"]),requireSellerVerified, deleteSellerProduct);

module.exports = router;