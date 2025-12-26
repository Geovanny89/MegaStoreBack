const Suscripcion = require("../../models/Suscripcion");
const User = require("../../models/User");
const cloudinary = require("../../utils/cloudinary");

const uploadPaymentProof = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "Archivo requerido" });
    }

    const seller = await User.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ error: "Seller no encontrado" });
    }

    // ✅ SOLO SI NO ESTÁ ACTIVO
    if (seller.sellerStatus === "active") {
      return res.status(400).json({
        error: "Tu tienda ya está activa"
      });
    }

    // buscar suscripción activa / rechazada
    const suscripcion = await Suscripcion.findOne({
      id_usuario: sellerId,
      estado: { $in: ["rechazada", "pendiente", "en_revision"] }
    });

    if (!suscripcion) {
      return res.status(404).json({ error: "Suscripción no encontrada" });
    }

    // 🔄 ACTUALIZAMOS
    suscripcion.paymentProof = file.path;
    suscripcion.paymentDate = new Date();
    suscripcion.estado = "en_revision";

    seller.sellerStatus = "pending_review";

    await suscripcion.save();
    await seller.save();

    res.json({ message: "Comprobante reenviado correctamente" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al subir comprobante" });
  }
};

const getSellerMe = async (req, res) => {
  try {
    const sellerId = req.user.id;

    const seller = await User.findById(sellerId).select(
      "name storeName slug sellerStatus paymentProof paymentDate rol"
    );

    if (!seller) {
      return res.status(404).json({ message: "Seller no encontrado" });
    }

    if (seller.rol !== "seller") {
      return res.status(403).json({ message: "Acceso no autorizado" });
    }

    res.json(seller);
  } catch (error) {
    console.error("❌ Error seller/me:", error);
    res.status(500).json({ message: "Error obteniendo seller" });
  }
};


module.exports = { uploadPaymentProof,getSellerMe };
