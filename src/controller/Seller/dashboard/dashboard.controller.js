const Order = require("../../../models/Order");

const getSellerDashboard = async (req, res) => {
  try {
    const sellerId = req.user._id;

    /* ================= FILTRO BASE ================= */
    const match = {
      "products.seller": sellerId,
      status: { $in: ["paid", "processing", "shipped", "delivered"] }
    };

    /* ================= HOY ================= */
    const startToday = new Date();
    startToday.setHours(0, 0, 0, 0);

    const today = await Order.aggregate([
      { $match: match },
      { $unwind: "$products" },
      { $match: { "products.seller": sellerId } },
      { $match: { createdAt: { $gte: startToday } } },
      {
        $group: {
          _id: null,
          total: { $sum: { $multiply: ["$products.price", "$products.quantity"] } }
        }
      }
    ]);

    /* ================= SEMANA (Últimos 7 días) ================= */
    const startWeek = new Date();
    startWeek.setDate(startWeek.getDate() - 7);

    const week = await Order.aggregate([
      { $match: match },
      { $unwind: "$products" },
      { $match: { "products.seller": sellerId } },
      { $match: { createdAt: { $gte: startWeek } } },
      {
        $group: {
          _id: null,
          total: { $sum: { $multiply: ["$products.price", "$products.quantity"] } }
        }
      }
    ]);

    /* ================= MES (Desde el día 1) ================= */
    const startMonth = new Date();
    startMonth.setDate(1);
    startMonth.setHours(0, 0, 0, 0);

    const month = await Order.aggregate([
      { $match: match },
      { $unwind: "$products" },
      { $match: { "products.seller": sellerId } },
      { $match: { createdAt: { $gte: startMonth } } },
      {
        $group: {
          _id: null,
          total: { $sum: { $multiply: ["$products.price", "$products.quantity"] } }
        }
      }
    ]);

    /* ================= VENTAS DIARIAS (Gráfica) ================= */
    const dailySales = await Order.aggregate([
      { $match: match },
      { $unwind: "$products" },
      { $match: { "products.seller": sellerId } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: { $multiply: ["$products.price", "$products.quantity"] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    /* ================= RESPUESTA FINAL ================= */
    res.json({
      summary: {
        today: today[0]?.total || 0,
        week: week[0]?.total || 0,
        month: month[0]?.total || 0
      },
      dailySales: dailySales.map(d => ({
        date: d._id,
        total: d.total
      })),
      // Información del vendedor necesaria para el Link y el QR en el Frontend
      seller: {
        slug: req.user.slug,
        storeName: req.user.storeName
      }
    });

  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ message: "Error al cargar dashboard" });
  }
};

module.exports = { getSellerDashboard };