const express = require("express");
const router = express.Router();
const { getProductReviews, createReview, getSellerReviews, deleteReview } = require("../../controller/Calificaciones/reviewController");
const checkRol = require("../../middleware/rol");
const authMiddleware = require("../../middleware/sesion");

router.post("/reviews/calificaciones", authMiddleware, createReview);
router.get("/reviews/product/:productId",  getProductReviews);
router.get("/reviews/seller/:id",  getSellerReviews);
router.delete("/reviews/:id", authMiddleware, checkRol(["admin"]), deleteReview);

module.exports = router;
