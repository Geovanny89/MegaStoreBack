const User = require("../../models/User");
const Product = require("../../models/Productos");
const Suscripcion = require("../../models/Suscripcion");

const getStoreBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const now = new Date();

    // 1️⃣ Buscar vendedor con identidad validada
    const seller = await User.findOne({
      slug,
      rol: "seller",
      "verification.isVerified": true,
      sellerStatus: {
        $nin: [
          "pending_identity",
          "rejected_identity",
          "suspended",
          "rejected"
        ]
      }
    }).select("-password");

    if (!seller) {
      return res.status(404).json({ message: "Tienda no encontrada" });
    }

    // 2️⃣ Última suscripción
    const suscripcion = await Suscripcion.findOne({
      id_usuario: seller._id
    }).sort({ createdAt: -1 });

    if (!suscripcion) {
      return res.status(404).json({ message: "Tienda no encontrada" });
    }

    // 3️⃣ Validar acceso por estado + fechas
    let canAccess = false;

    // ✅ TRIAL vigente
    if (
      suscripcion.estado === "trial" &&
      suscripcion.fecha_vencimiento &&
      now <= suscripcion.fecha_vencimiento
    ) {
      canAccess = true;
    }

    // ✅ ACTIVA vigente
    if (
      suscripcion.estado === "activa" &&
      (!suscripcion.fecha_vencimiento || now <= suscripcion.fecha_vencimiento)
    ) {
      canAccess = true;
    }

    if (!canAccess) {
      return res.status(404).json({ message: "Tienda no encontrada" });
    }

    // 4️⃣ Productos
    const productos = await Product
      .find({ seller: seller._id })
      .populate("tipo");

    res.json({
      seller,
      productos
    });

  } catch (error) {
    console.error("❌ getStoreBySlug:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

module.exports = { getStoreBySlug };
