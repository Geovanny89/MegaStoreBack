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
    // console.log("vendedor",sellerId)
    const seller = await User.findById(sellerId).select(
      "name storeName slug sellerStatus rol verification paymentMethods"
    );

    if (!seller) {
      return res.status(404).json({ message: "Seller no encontrado" });
    }

    if (seller.rol !== "seller") {
      return res.status(403).json({ message: "Acceso no autorizado" });
    }

    const suscripcion = await Suscripcion.findOne({
      id_usuario: sellerId
    }).sort({ createdAt: -1 });

    const now = new Date();

    /* ================= IDENTITY FLAGS ================= */

    const identityVerified = seller.verification?.isVerified === true;

    const identityRejected =
      seller.verification?.isVerified === false &&
      !!seller.verification?.verificationReason;

    const identityPending =
      seller.verification?.isVerified === false &&
      !seller.verification?.verificationReason;

    /* ================= SUBSCRIPTION ================= */

    let subscriptionStatus = "none";
    let isTrial = false;

    if (suscripcion) {
      if (suscripcion.estado === "trial") {
        if (suscripcion.fecha_vencimiento && now <= suscripcion.fecha_vencimiento) {
          subscriptionStatus = "trial";
          isTrial = true;
        } else {
          suscripcion.estado = "pendiente";
          await suscripcion.save();
          subscriptionStatus = "pending_payment";
        }
      }

      else if (suscripcion.estado === "activa") {
        if (suscripcion.fecha_vencimiento && now <= suscripcion.fecha_vencimiento) {
          subscriptionStatus = "active";
        } else {
          suscripcion.estado = "vencida";
          await suscripcion.save();
          subscriptionStatus = "expired";
        }
      }

      else {
        subscriptionStatus = suscripcion.estado;
      }
    }

    /* ================= SELLER STATUS (DB) ================= */

    let dbSellerStatus = seller.sellerStatus;

    if (identityRejected) {
      dbSellerStatus = "rejected_identity";
    } else if (identityPending) {
      dbSellerStatus = "pending_identity";
    } else {
      if (subscriptionStatus === "pending_payment") {
        dbSellerStatus = "pending_payment";
      }
      if (subscriptionStatus === "en_revision") {
        dbSellerStatus = "pending_review";
      }
      if (subscriptionStatus === "expired") {
        dbSellerStatus = "expired";
      }
      if (subscriptionStatus === "active") {
        dbSellerStatus = "active";
      }
    }

  if (seller.sellerStatus !== dbSellerStatus) {
  await User.updateOne(
    { _id: sellerId },
    { sellerStatus: dbSellerStatus }
  );
}


    /* ================= SELLER STATUS (UI) ================= */

    let uiSellerStatus = dbSellerStatus;

    // 🔥 TRIAL solo para UI
    if (subscriptionStatus === "trial") {
      uiSellerStatus = "trial";
    }

    /* ================= RESPONSE ================= */

    return res.json({
      sellerStatus: uiSellerStatus, // 👈 frontend ve trial

      permissions: {
        canAccessDashboard: true,
        canPublishProducts: identityVerified,
        canSell:
          identityVerified &&
          (subscriptionStatus === "active" || subscriptionStatus === "trial"),
        needsIdentityVerification: !identityVerified,
        needsPayment: subscriptionStatus === "pending_payment",
        identityRejected,
        identityPending
      },

      subscription: {
        status: subscriptionStatus,
        isTrial,
        expiresAt: suscripcion?.fecha_vencimiento || null
      },

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
