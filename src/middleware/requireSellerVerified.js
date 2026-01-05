const User = require("../models/User");

const requireSellerVerified = async (req, res, next) => {
  try {
    const sellerId = req.user.id;

    const seller = await User.findById(sellerId).select(
      "sellerStatus verification"
    );

    if (!seller) {
      return res.status(404).json({
        code: "SELLER_NOT_FOUND",
        message: "Vendedor no encontrado"
      });
    }

    /* =============================
       1️⃣ IDENTIDAD RECHAZADA
    ============================== */
    if (
      seller.verification?.isVerified === false &&
      seller.verification?.verificationReason
    ) {
      return res.status(403).json({
        code: "IDENTITY_REJECTED",
        message: "Tu identidad fue rechazada"
      });
    }

    /* =============================
       2️⃣ IDENTIDAD EN REVISIÓN
    ============================== */
    if (seller.verification?.isVerified === false) {
      return res.status(403).json({
        code: "IDENTITY_IN_REVIEW",
        message: "Tu identidad está en revisión"
      });
    }

    /* =============================
       3️⃣ IDENTIDAD NO ENVIADA
    ============================== */
    if (!seller.verification) {
      return res.status(403).json({
        code: "IDENTITY_REQUIRED",
        message: "Debes verificar tu identidad para publicar productos"
      });
    }

    /* =============================
       4️⃣ IDENTIDAD OK
    ============================== */
    if (seller.verification.isVerified === true) {
      return next();
    }

    // Fallback ultra seguro
    return res.status(403).json({
      code: "IDENTITY_REQUIRED",
      message: "Verificación requerida"
    });

  } catch (error) {
    console.error("❌ requireSellerVerified:", error);
    return res.status(500).json({
      message: "Error validando identidad del vendedor"
    });
  }
};

module.exports = requireSellerVerified;
