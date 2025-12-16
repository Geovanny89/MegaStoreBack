const Notification = require("../../models/Notification");

/* ============================================
   Obtener notificaciones del usuario autenticado
============================================ */
const getNotificationsByUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("order", "_id status total");

    res.json(notifications);
  } catch (error) {
    console.error("Error al obtener notificaciones:", error);
    res.status(500).json({ message: "Error al obtener notificaciones" });
  }
};

/* ============================================
   Marcar notificación como leída
============================================ */
const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notificación no encontrada" });
    }

    res.json(notification);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al marcar notificación" });
  }
};

module.exports = {
  getNotificationsByUser,
  markNotificationRead,
};
