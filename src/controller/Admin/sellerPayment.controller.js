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

    if (seller.sellerStatus === "active") {
      return res.status(400).json({
        error: "Tu tienda ya está activa"
      });
    }

  const suscripcion = await Suscripcion.findOne({
  id_usuario: sellerId
});
    if (!suscripcion) {
      return res.status(404).json({ error: "Suscripción no encontrada" });
    }

    /* ===============================
       ☁️ SUBIR A CLOUDINARY (BUFFER)
    =============================== */
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "payment_proofs",
          resource_type: "auto"
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      stream.end(file.buffer);
    });

    /* ===============================
       🔄 ACTUALIZAR ESTADOS
    =============================== */
    suscripcion.paymentProof = result.secure_url;
    suscripcion.paymentDate = new Date();
    suscripcion.estado = "en_revision";

    seller.sellerStatus = "pending_review";

    await suscripcion.save();
    await seller.save();

    res.json({
      message: "Comprobante enviado correctamente",
      paymentProof: result.secure_url
    });

  } catch (error) {
    console.error("❌ Error uploadPaymentProof:", error);
    res.status(500).json({ error: "Error al subir comprobante" });
  }
};

const getSellerMe = async (req, res) => {
  try {
    const sellerId = req.user.id;

    const seller = await User.findById(sellerId).select(
      "name storeName slug sellerStatus rol"
    );

    if (!seller) {
      return res.status(404).json({ message: "Seller no encontrado" });
    }

    if (seller.rol !== "seller") {
      return res.status(403).json({ message: "Acceso no autorizado" });
    }

    const suscripcion = await Suscripcion.findOne({ id_usuario: sellerId });
    const now = new Date();

    /* =========================================
       1️⃣ CALCULAR SI ESTÁ VENCIDA (SIN PISAR PAGO)
    ========================================= */
    let isExpired = false;

    if (
      !suscripcion ||
      suscripcion.estado === "vencida" ||
      (suscripcion.fecha_vencimiento && now > suscripcion.fecha_vencimiento)
    ) {
      isExpired = true;

      if (suscripcion && suscripcion.estado !== "vencida") {
        suscripcion.estado = "vencida";
        await suscripcion.save();
      }
    }

    /* =========================================
       2️⃣ DEFINIR sellerStatus SOLO POR ACCESO
    ========================================= */
    let sellerStatus = "active";

    if (isExpired) {
      sellerStatus = "expired";
    }

    if (suscripcion?.estado === "en_revision") {
      sellerStatus = "pending_review";
    }

    // ⛔ NO CAMBIAMOS sellerStatus SI EL PAGO FUE RECHAZADO
    // rejected es SOLO información de UI

    if (seller.sellerStatus !== sellerStatus) {
      seller.sellerStatus = sellerStatus;
      await seller.save();
    }

    /* =========================================
       3️⃣ RESPUESTA COMPLETA (CLAVE)
    ========================================= */
    return res.json({
      sellerStatus,                 // acceso
      paymentStatus: suscripcion?.estado || null, // estado del pago
      seller,
      suscripcion
    });

  } catch (error) {
    console.error("❌ Error seller/me:", error);
    return res.status(500).json({ message: "Error obteniendo estado del seller" });
  }
};






module.exports = { uploadPaymentProof,getSellerMe };
