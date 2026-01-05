const Report = require("../../models/Report");
const User = require("../../models/User");

/* ==============================
   📋 OBTENER TODOS LOS REPORTES
============================== */
const getAllReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate("reporter", "name email")
      .populate("seller", "storeName email sellerStatus reportsCount")
      .populate("order", "_id status total")
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    console.error("❌ Error obteniendo reportes:", error);
    res.status(500).json({ message: "Error al obtener reportes" });
  }
};

/* ==============================
   👀 MARCAR REPORTE COMO REVISADO
============================== */
const reviewReport = async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: "Reporte no encontrado" });
    }

    report.status = "reviewed";
    await report.save();

    res.json({ message: "Reporte marcado como revisado" });
  } catch (error) {
    console.error("❌ Error revisando reporte:", error);
    res.status(500).json({ message: "Error al revisar reporte" });
  }
};

/* ==============================
   ❌ DESCARTAR REPORTE
============================== */
const dismissReport = async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: "Reporte no encontrado" });
    }

    report.status = "dismissed";
    await report.save();

    res.json({ message: "Reporte descartado correctamente" });
  } catch (error) {
    console.error("❌ Error descartando reporte:", error);
    res.status(500).json({ message: "Error al descartar reporte" });
  }
};

/* ==============================
   🔓 REACTIVAR VENDEDOR (OPCIONAL)
============================== */
const reactivateSeller = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const seller = await User.findById(sellerId);
    if (!seller || seller.rol !== "seller") {
      return res.status(404).json({ message: "Vendedor no encontrado" });
    }

    seller.sellerStatus = "active";
    seller.reportsCount = 0;
    await seller.save();

    res.json({ message: "Vendedor reactivado correctamente" });
  } catch (error) {
    console.error("❌ Error reactivando vendedor:", error);
    res.status(500).json({ message: "Error al reactivar vendedor" });
  }
};

module.exports = {
  getAllReports,
  reviewReport,
  dismissReport,
  reactivateSeller
};
