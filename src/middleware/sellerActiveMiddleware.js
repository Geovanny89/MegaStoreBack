const Suscripcion = require("../models/Suscripcion");

const sellerActiveMiddleware = async (req, res, next) => {
  try {
    if (req.user.rol !== "seller") return next();

    const suscripcion = await Suscripcion.findOne({
      id_usuario: req.user.id
    });

    if (!suscripcion) {
      return res.status(403).json({
        error: "No tienes una suscripción activa"
      });
    }

    const now = new Date();

    /* ===============================
       🔴 BLOQUEOS DUROS
    =============================== */

    if (suscripcion.estado === "pendiente") {
      return res.status(403).json({
        error: "Debes subir el comprobante de pago"
      });
    }

    if (suscripcion.estado === "en_revision") {
      return res.status(403).json({
        error: "Tu pago está en revisión"
      });
    }

    if (suscripcion.estado === "rechazada") {
      return res.status(403).json({
        error: "Tu comprobante fue rechazado"
      });
    }

    if (
      suscripcion.estado === "vencida" ||
      (suscripcion.estado === "activa" &&
        suscripcion.fecha_vencimiento &&
        now > suscripcion.fecha_vencimiento)
    ) {
      return res.status(403).json({
        error: "Tu suscripción está vencida. Debes renovarla."
      });
    }

    /* ===============================
       🟢 SOLO AQUÍ PASA
    =============================== */
    if (suscripcion.estado !== "activa") {
      return res.status(403).json({
        error: "Tu tienda no está activa"
      });
    }

    next();
  } catch (error) {
    console.error("❌ sellerActiveMiddleware:", error);
    res.status(500).json({ error: "Error validando suscripción" });
  }
};

module.exports = { sellerActiveMiddleware };
