const Suscripcion = require("../models/Suscripcion");

const sellerActiveMiddleware = async (req, res, next) => {
  try {
    // Solo aplica a sellers
    if (req.user.rol !== "seller") return next();

    const suscripcion = await Suscripcion.findOne({
      id_usuario: req.user.id
    });

    if (!suscripcion) {
      return res.status(403).json({
        error: "No tienes una suscripción"
      });
    }

    const now = new Date();

    /* ===============================
       🔴 VENCIMIENTO (TRIAL O PAGO)
    =============================== */
    if (
      suscripcion.fecha_vencimiento &&
      now > suscripcion.fecha_vencimiento
    ) {
      return res.status(403).json({
        error: "Tu suscripción está vencida. Debes activarla para continuar."
      });
    }

    /* ===============================
       🔴 BLOQUEOS ADMINISTRATIVOS
    =============================== */
    if (["pendiente", "en_revision", "rechazada"].includes(suscripcion.estado)) {
      return res.status(403).json({
        error: "Tu suscripción no está habilitada"
      });
    }

    /* ===============================
       🟢 PERMITIDOS
       trial → 5 días gratis
       activa → pago aprobado
    =============================== */
    if (["trial", "activa"].includes(suscripcion.estado)) {
      return next();
    }

    /* ===============================
       ❌ CUALQUIER OTRO CASO
    =============================== */
    return res.status(403).json({
      error: "Acceso no permitido"
    });

  } catch (error) {
    console.error("❌ sellerActiveMiddleware:", error);
    res.status(500).json({
      error: "Error validando suscripción"
    });
  }
};

module.exports = { sellerActiveMiddleware };
