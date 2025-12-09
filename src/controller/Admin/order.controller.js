const Order = require("../../models/Order");

/* ============================================================
   1. VENDEDOR: Ver solo sus órdenes
   ============================================================ */
const getSellerOrders = async (req, res) => {
  try {
    const sellerId = req.user.id;

    const orders = await Order.find({
      "products.seller": sellerId
    })
      .populate("products.product")
      .populate("user");

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error obteniendo órdenes del vendedor." });
  }
};

/* ============================================================
   2. VENDEDOR: Poner orden en Processing
   ============================================================ */
const markOrderProcessing = async (req, res) => {
  try {
    const { orderId } = req.params;
    const sellerId = req.user.id;

    const order = await Order.findOne({
      _id: orderId,
      "products.seller": sellerId
    });

    if (!order) {
      return res.status(404).json({ message: "Orden no encontrada para este vendedor" });
    }

    if (order.status !== "paid") {
      return res.status(400).json({ message: "La orden debe estar paga para procesarse." });
    }

    order.status = "processing";
    await order.save();

    res.json({ message: "Orden marcada como en procesamiento", order });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar orden." });
  }
};

/* ============================================================
   3. VENDEDOR: Marcar como Shipped
   ============================================================ */
const markOrderShipped = async (req, res) => {
  try {
    const { orderId } = req.params;
    const sellerId = req.user.id;

    const order = await Order.findOne({
      _id: orderId,
      "products.seller": sellerId
    });

    if (!order) {
      return res.status(404).json({ message: "Orden no encontrada para este vendedor" });
    }

    if (order.status !== "processing") {
      return res.status(400).json({ message: "La orden debe estar en procesamiento." });
    }

    order.status = "shipped";
    await order.save();

    res.json({ message: "Orden marcada como enviada", order });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar orden." });
  }
};

/* ============================================================
   4. COMPRADOR: Confirmar Delivered
   ============================================================ */
const markOrderDelivered = async (req, res) => {
  try {
    const { orderId } = req.params;
    const buyerId = req.user.id;

    const order = await Order.findOne({
      _id: orderId,
      user: buyerId
    });

    if (!order) {
      return res.status(404).json({ message: "Orden no encontrada para este comprador" });
    }

    if (order.status !== "shipped") {
      return res.status(400).json({ message: "La orden debe estar enviada para confirmarse." });
    }

    order.status = "delivered";
    await order.save();

    console.log("Liberar dinero al vendedor");

    res.json({ message: "Orden marcada como entregada", order });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar orden." });
  }
};

module.exports = {
  getSellerOrders,
  markOrderProcessing,
  markOrderShipped,
  markOrderDelivered,
};
