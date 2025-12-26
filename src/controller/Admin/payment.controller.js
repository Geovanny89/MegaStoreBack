const { transporter } = require("../../mailer/nodemailer");
const Suscripcion = require("../../models/Suscripcion");
const User = require("../../models/User");

const validatePayment = async (req, res) => {
  try {
    const { suscripcionId } = req.params;
    const { action } = req.body; // approve | reject

    const suscripcion = await Suscripcion.findById(suscripcionId)
      .populate("id_usuario");

    if (!suscripcion) {
      return res.status(404).json({ error: "Suscripción no encontrada" });
    }

    const seller = suscripcion.id_usuario;

    if (action === "approve") {
      /* ===============================
         🟢 ACTIVAR Y RENOVAR
      =============================== */
      const now = new Date();

      suscripcion.estado = "activa";
      suscripcion.fecha_inicio = now;

      // 👇 RENOVACIÓN MENSUAL (AJUSTA SI ES OTRO PLAN)
      suscripcion.fecha_vencimiento = new Date(
        new Date().setMonth(now.getMonth() + 1)
      );

      seller.sellerStatus = "active";
    } 
    else if (action === "reject") {
      /* ===============================
         🔴 RECHAZAR (NO TOCAR FECHAS)
      =============================== */
      suscripcion.estado = "rechazada";
      seller.sellerStatus = "expired"; // sigue bloqueado
    } 
    else {
      return res.status(400).json({ error: "Acción inválida" });
    }

    await suscripcion.save();
    await seller.save();

    /* ===============================
       🔔 NOTIFICACIÓN
    =============================== */
    await transporter.sendMail({
      to: seller.email,
      subject: action === "approve"
        ? "Pago aprobado"
        : "Pago rechazado",
      text: action === "approve"
        ? "Tu suscripción fue renovada y tu tienda ya está activa."
        : "Tu comprobante fue rechazado. Por favor sube uno nuevo."
    });

    res.json({
      message:
        action === "approve"
          ? "Pago aprobado y suscripción renovada"
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
