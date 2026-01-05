const Suscripcion = require("../models/Suscripcion");

const sellerDashboardMiddleware = async (req, res, next) => {
  try {
    if (req.user.rol !== "seller") return next();

    const suscripcion = await Suscripcion.findOne({
      id_usuario: req.user.id
    });

    const now = new Date();

    // Si hay suscripción
    if (suscripcion) {
      // Trial terminado → bloquear
      if (suscripcion.estado === "trial" && suscripcion.fecha_vencimiento && now > suscripcion.fecha_vencimiento) {
        return res.status(403).json({
          code: "TRIAL_ENDED",
          message: "Tu periodo de prueba terminó. Envía el comprobante para continuar."
        });
      }

      // Pago pendiente → bloquear
      if (["pendiente", "en_revision"].includes(suscripcion.estado)) {
        return res.status(403).json({
          code: "PAYMENT_PENDING",
          message: "Tu pago está en revisión. Espera la aprobación."
        });
      }
    }

    // Si no hay suscripción aún, pero el usuario está en trial → permitir acceso
    return next();

  } catch (error) {
    console.error("❌ sellerDashboardMiddleware:", error);
    return res.status(500).json({
      message: "Error validando acceso al dashboard"
    });
  }
};


module.exports = sellerDashboardMiddleware;
