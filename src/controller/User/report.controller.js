const Report = require("../../models/Report");
const User = require("../../models/User");
const Order = require("../../models/Order");

const reportSeller = async (req, res) => {
  try {
    const reporterId = req.user.id;
    const { sellerId } = req.params;
    const { reason, description, orderId } = req.body;

    if (reporterId === sellerId) {
      return res.status(400).json({
        message: "No puedes reportarte a ti mismo"
      });
    }

    /* ============================
       1️⃣ Validar vendedor
    ============================ */
    const seller = await User.findById(sellerId);

    if (!seller || seller.rol !== "seller") {
      return res.status(404).json({
        message: "Vendedor no encontrado"
      });
    }

    /* ============================
       2️⃣ Validar orden obligatoria
    ============================ */
    if (!orderId) {
      return res.status(400).json({
        message: "Debes seleccionar una orden para reportar"
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      user: reporterId,
      status: { $ne: "cancelled" }
    }).populate("products.seller");

    if (!order) {
      return res.status(403).json({
        message: "Orden no válida para este reporte"
      });
    }

    /* ============================
       3️⃣ Verificar que el vendedor
       esté en la orden
    ============================ */
    const sellerInOrder = order.products.some(
      (p) => p.seller._id.toString() === sellerId
    );

    if (!sellerInOrder) {
      return res.status(403).json({
        message: "Este vendedor no pertenece a la orden seleccionada"
      });
    }

    /* ============================
       4️⃣ Evitar spam (1 reporte)
    ============================ */
    const alreadyReported = await Report.findOne({
      reporter: reporterId,
      seller: sellerId,
      order: orderId
    });

    if (alreadyReported) {
      return res.status(400).json({
        message: "Ya reportaste este vendedor por esta orden"
      });
    }

    /* ============================
       5️⃣ Crear reporte
    ============================ */
    await Report.create({
      reporter: reporterId,
      seller: sellerId,
      reason,
      description,
      order: orderId
    });

    /* ============================
       6️⃣ Penalización automática
    ============================ */
    seller.reportsCount += 1;

    if (seller.reportsCount >= 5) {
      seller.sellerStatus = "suspended";
    }

    await seller.save();

    return res.json({
      message: "Reporte enviado correctamente"
    });

  } catch (error) {
    console.error("❌ Error reportando vendedor:", error);
    return res.status(500).json({
      message: "Error al reportar vendedor"
    });
  }
};

module.exports = { reportSeller };
