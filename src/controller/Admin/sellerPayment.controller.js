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
       1️⃣ ESTADO BASE (SEGÚN PAGO)
    ========================================= */
   let sellerStatus = seller.sellerStatus;

if (!suscripcion || suscripcion.estado === "pendiente") {
  sellerStatus = "pending_payment";
}

if (suscripcion?.estado === "en_revision") {
  sellerStatus = "pending_review";
}

if (suscripcion?.estado === "rechazada") {
  sellerStatus = "rejected";
}

/* 🔴 ESTE ERA EL BLOQUE QUE FALTABA */
if (suscripcion?.estado === "vencida") {
  sellerStatus = "expired";
}

/* =========================================
   SOLO SI ESTÁ ACTIVA, VALIDAR FECHA
========================================= */
if (
  suscripcion?.estado === "activa" &&
  suscripcion.fecha_vencimiento &&
  now > suscripcion.fecha_vencimiento
) {
  suscripcion.estado = "vencida";
  sellerStatus = "expired";
  await suscripcion.save();
}


    /* =========================================
       3️⃣ SINCRONIZAR SELLER
    ========================================= */
    if (seller.sellerStatus !== sellerStatus) {
      seller.sellerStatus = sellerStatus;
      await seller.save();
    }

    return res.json({
      sellerStatus,
      paymentStatus: suscripcion?.estado || null,
      seller,
      suscripcion
    });

  } catch (error) {
    console.error("❌ Error seller/me:", error);
    return res.status(500).json({
      message: "Error obteniendo estado del seller"
    });
  }
};







module.exports = { uploadPaymentProof,getSellerMe };
