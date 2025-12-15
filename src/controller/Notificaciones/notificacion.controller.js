const Notification = require("../../models/Notification");
const User = require("../../models/User");
const { transporter, notificationMail } = require("../../mailer/nodemailer");

/* ===================== OBTENER NOTIFICACIONES ===================== */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("order", "total deliveryMethod paymentMethod status");

    return res.status(200).json({ notifications });
  } catch (error) {
    console.error("Error al obtener notificaciones:", error);
    return res.status(500).json({
      message: "Error interno al obtener notificaciones",
    });
  }
};

/* ===================== MARCAR COMO LEÍDA ===================== */
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        message: "Notificación no encontrada",
      });
    }

    return res.status(200).json({
      message: "Notificación marcada como leída",
      notification,
    });
  } catch (error) {
    console.error("Error al marcar notificación:", error);
    return res.status(500).json({
      message: "Error interno",
    });
  }
};

/* ===================== CREAR NOTIFICACIÓN + EMAIL ===================== */
/* 👉 úsalo cuando se crea un pedido */
const createNotification = async ({ userId, message, order }) => {
  const user = await User.findById(userId);
  if (!user) return;

  const notification = await Notification.create({
    user: userId,
    message,
    order: order?._id,
    isRead: false,
  });

  // Enviar correo (NO afecta bienvenida)
  await transporter.sendMail(
    notificationMail({
      email: user.email,
      name: user.storeName || user.name,
      message,
      order,
    })
  );

  return notification;
};

module.exports = {
  getNotifications,
  markAsRead,
  createNotification,
};
