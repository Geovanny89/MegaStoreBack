const Order = require("../../models/Order");

/* ============================================================
   ADMIN: Ver todas las órdenes
   ============================================================ */
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("products.product")
      .populate("user");

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error obteniendo órdenes" });
  }
};

/* ============================================================
   ADMIN: Cancelar orden
   ============================================================ */
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Orden no encontrada" });

    if (order.status === "shipped" || order.status === "delivered") {
      return res.status(400).json({ message: "No se puede cancelar una orden enviada" });
    }

    order.status = "cancelled";
    await order.save();

    res.json({ message: "Orden cancelada", order });
  } catch (error) {
    res.status(500).json({ message: "Error cancelando orden" });
  }
};

module.exports = {
  getAllOrders,
  cancelOrder
};
