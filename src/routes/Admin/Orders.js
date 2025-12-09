// const express = require("express");
// const authMiddleware = require("../../middleware/sesion");
// const checkRol = require("../../middleware/rol");

// const {getSellerOrders,getAllOrders,updateOrderStatus} = require("../../controller/Admin/order.controller");

// const router = express.Router();



// /* =====================================================
//    RUTAS PARA EL VENDEDOR
//    ===================================================== */

// // Ver órdenes donde el producto le pertenece al vendedor
// router.get("/seller-orders",authMiddleware,checkRol(["seller", "admin"]),getSellerOrders);


// /* =====================================================
//    RUTAS PARA EL ADMINISTRADOR
//    ===================================================== */

// // Ver todas las órdenes del sistema
// router.get(
//   "/",
//   authMiddleware,
//   checkRol(["admin"]),
//   getAllOrders
// );

// // Cambiar estado de cualquier orden
// router.patch(
//   "/status/:id",
//   authMiddleware,
//   checkRol(["admin", "seller"]),
//   updateOrderStatus
// );

// module.exports = router;
