const ProductReview = require("../../models/ProductReview");
const Order = require("../../models/Order");
const Productos = require("../../models/Productos");
const User = require("../../models/User");

/**
 * ===============================
 * ➕ CREAR REVIEW (producto + vendedor)
 * ===============================
 * Reglas:
 * - Solo comprador
 * - Orden debe estar DELIVERED
 * - Una review por producto por orden
 */
const createReview = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      orderId,
      productId,
      ratingProduct,
      ratingSeller,
      comment
    } = req.body;

    // ❗ FIX validación (rating 1 es válido)
    if (
      !orderId ||
      !productId ||
      ratingProduct < 1 ||
      ratingSeller < 1
    ) {
      return res.status(400).json({
        message: "Datos incompletos para la calificación"
      });
    }

    // 1️⃣ Validar orden entregada
    const order = await Order.findOne({
      _id: orderId,
      user: userId,
      status: "delivered"
    });

    if (!order) {
      return res.status(403).json({
        message: "Solo puedes calificar órdenes entregadas"
      });
    }

    // 2️⃣ Validar producto en la orden
    const orderProduct = order.products.find(
      p => p.product.toString() === productId
    );

    if (!orderProduct) {
      return res.status(400).json({
        message: "Este producto no pertenece a la orden"
      });
    }

    // 🔒 NUEVO: bloquear si ya fue calificado
    if (orderProduct.reviewed === true) {
      return res.status(400).json({
        message: "Este producto ya fue calificado"
      });
    }

    const sellerId = orderProduct.seller;

    // 3️⃣ Defensa adicional (índice único)
    const exists = await ProductReview.findOne({
      userId,
      orderId,
      productId
    });

    if (exists) {
      return res.status(400).json({
        message: "Ya calificaste este producto"
      });
    }

    // 4️⃣ Crear review
    const review = await ProductReview.create({
      orderId,
      productId,
      sellerId,
      userId,
      ratingProduct,
      ratingSeller,
      comment
    });

    // ================= PRODUCTO =================
    const product = await Productos.findById(productId);

    if (!product.rating) {
      product.rating = { average: 0, count: 0 };
    }

    const newProductCount = product.rating.count + 1;
    const newProductAvg =
      (product.rating.average * product.rating.count + ratingProduct) /
      newProductCount;

    product.rating.average = Number(newProductAvg.toFixed(1));
    product.rating.count = newProductCount;
    await product.save();

    // ================= VENDEDOR =================
    const seller = await User.findById(sellerId);

    if (!seller.sellerRating) {
      seller.sellerRating = { average: 0, count: 0 };
    }

    const newSellerCount = seller.sellerRating.count + 1;
    const newSellerAvg =
      (seller.sellerRating.average * seller.sellerRating.count + ratingSeller) /
      newSellerCount;

    seller.sellerRating.average = Number(newSellerAvg.toFixed(1));
    seller.sellerRating.count = newSellerCount;
    await seller.save();

    // 🔐 MARCAR PRODUCTO COMO CALIFICADO (CLAVE)
    orderProduct.reviewed = true;
    await order.save();

    return res.status(201).json({
      message: "Calificación registrada correctamente",
      review
    });

  } catch (error) {
    console.error("Error creando review:", error);

    // 🔒 Manejo del índice único
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Ya calificaste este producto"
      });
    }

    res.status(500).json({
      message: "Error interno al crear la calificación"
    });
  }
};



/**
 * ===============================
 * 📦 OBTENER REVIEWS DE UN PRODUCTO
 * ===============================
 */
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await ProductReview.find({ productId })
      .populate("userId", "name")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({
      message: "Error obteniendo reviews del producto"
    });
  }
};

/**
 * ===============================
 * 🏪 OBTENER REVIEWS DE UN VENDEDOR
 * ===============================
 */
const getSellerReviews = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const reviews = await ProductReview.find({ sellerId })
      .populate("userId", "name")
      .populate("productId", "name")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({
      message: "Error obteniendo reviews del vendedor"
    });
  }
};

/**
 * ===============================
 * ❌ ELIMINAR REVIEW (admin)
 * ===============================
 */
const deleteReview = async (req, res) => {
  try {
    if (req.user.rol !== "admin") {
      return res.status(403).json({
        message: "No autorizado"
      });
    }

    const { id } = req.params;

    const review = await ProductReview.findById(id);
    if (!review) {
      return res.status(404).json({
        message: "Review no encontrada"
      });
    }

    await ProductReview.findByIdAndDelete(id);

    res.json({
      message: "Review eliminada"
    });

  } catch (error) {
    res.status(500).json({
      message: "Error eliminando review"
    });
  }
};

module.exports = {
  createReview,
  getProductReviews,
  getSellerReviews,
  deleteReview
};
