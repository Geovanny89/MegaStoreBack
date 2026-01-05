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
         🟢 APROBAR PAGO → 30 DÍAS
      =============================== */
      const inicio = new Date();
      const vencimiento = new Date();
      vencimiento.setDate(inicio.getDate() + 30); // ✅ 30 días exactos

      suscripcion.estado = "activa";
      suscripcion.fecha_inicio = inicio;
      suscripcion.fecha_vencimiento = vencimiento;

      seller.sellerStatus = "active";
    } 
    else if (action === "reject") {
      /* ===============================
         🔴 RECHAZAR PAGO
      =============================== */
      suscripcion.estado = "rechazada";
      seller.sellerStatus = "expired";
    } 
    else {
      return res.status(400).json({ error: "Acción inválida" });
    }

    await suscripcion.save();
    await seller.save();

    /* ===============================
       📧 NOTIFICACIÓN
    =============================== */
    await transporter.sendMail({
      to: seller.email,
      subject: action === "approve"
        ? "Pago aprobado"
        : "Pago rechazado",
      text: action === "approve"
        ? "Tu suscripción fue activada por 30 días."
        : "Tu comprobante fue rechazado. Por favor sube uno nuevo."
    });

    res.json({
      message:
        action === "approve"
          ? "Pago aprobado. Suscripción activa por 30 días"
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
const getPendingIdentity = async (req, res) => {
  try {
    const sellers = await User.find({
      rol: "seller",
      sellerStatus: "pending_identity" // ✅ CAMPO CORRECTO
    }).select("-password");

    res.json(sellers);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener vendedores" });
  }
};


// 2. Aprobar o Rechazar identidad (CON LÓGICA DE BLOQUEO)
// controller/Admin/payment.controller.js
const approveIdentity = async (req, res) => {
  const { userId } = req.params;
  const { action, reason } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (action === "approve") {
      user.verification.isVerified = true;
      user.verification.verifiedAt = new Date();
      user.verification.verificationReason = null;
      user.sellerStatus = "pending_payment";
    }

    if (action === "reject") {
      user.verification.isVerified = false;
      user.verification.verificationReason = reason || "Identidad rechazada";
      user.sellerStatus = "rejected";
    }

    // Guardar cambios
    await user.save();

    // Devolver usuario actualizado para frontend
    res.json({
      message: action === "approve" ? "Identidad aprobada" : "Identidad rechazada",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        sellerStatus: user.sellerStatus,
        verification: user.verification
      }
    });
  } catch (error) {
    console.error("Error approveIdentity:", error);
    res.status(500).json({ message: "Error al procesar" });
  }
};




module.exports = { 
  validatePayment,
  sellerPending,
  getPendingIdentity,
  approveIdentity 
};
