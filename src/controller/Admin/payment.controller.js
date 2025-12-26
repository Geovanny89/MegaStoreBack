const { transporter } = require("../../mailer/nodemailer");
const Suscripcion = require("../../models/Suscripcion");
const User = require("../../models/User");

const validatePayment = async (req, res) => {
  try {
    const { suscripcionId } = req.params;
    const { action } = req.body; // "approve" | "reject"

    const suscripcion = await Suscripcion.findById(suscripcionId)
      .populate("id_usuario");

    if (!suscripcion) {
      return res.status(404).json({ error: "Suscripción no encontrada" });
    }

    if (action === "approve") {
      suscripcion.estado = "activa";
      suscripcion.id_usuario.sellerStatus = "active";
    } 
    else if (action === "reject") {
      suscripcion.estado = "rechazada";
      suscripcion.id_usuario.sellerStatus = "rejected";
    } 
    else {
      return res.status(400).json({ error: "Acción inválida" });
    }

    // 🔹 GUARDAMOS CAMBIOS 
    await suscripcion.save();
    await suscripcion.id_usuario.save();

    // 🔔 NOTIFICACIÓN AL SELLER (AQUÍ VA)
    await transporter.sendMail ({
      to: suscripcion.id_usuario.email,
      subject: action === "approve"
        ? "Pago aprobado"
        : "Pago rechazado",
      text: action === "approve"
        ? "Tu tienda ya está activa y puedes comenzar a vender."
        : "Tu comprobante fue rechazado. Por favor sube uno nuevo."
    });

    // ✅ RESPUESTA AL ADMIN
    res.json({
      message:
        action === "approve"
          ? "Pago aprobado y tienda activada"
          : "Pago rechazado correctamente"
    });

  } catch (error) {
    console.error("❌ Error validando pago:", error);
    res.status(500).json({ error: "Error al validar pago" });
  }
};


const sellerPending = async (req, res) => {
  try {
    const suscripciones = await Suscripcion.find({
      estado: "en_revision"
    }).populate("id_usuario", "storeName email");

    res.json(suscripciones);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo pagos pendientes" });
  }
};


module.exports = { validatePayment,sellerPending };
