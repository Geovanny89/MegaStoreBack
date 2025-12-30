const Notification = require("../../models/Notification");
const User = require("../../models/User");
const { transporter, notificationMail } = require("../../mailer/nodemailer");


/* ===================== OBTENER NOTIFICACIONES ===================== */
// Obtener notificaciones del USUARIO
const getUserNotifications = async (req, res) => {
  const userId = req.user.id;

  const notifications = await Notification.find({
    user: userId
  })
  .sort({ createdAt: -1 })
  .limit(20);

  res.json(notifications);
};


/* ===================== MARCAR COMO LEÍDA ===================== */
const markAsRead = async (req, res) => {
  const { id } = req.params;
  
  const notification = await Notification.findOneAndUpdate(
    {
      _id: id,
      $or: [
        { user: req.user._id },
        { seller: req.user._id }
      ]
    },
    { isRead: true },
    { new: true }
  );
  
  if (!notification) {
    return res.status(404).json({ message: "No encontrada" });
  }
  
  res.json(notification);
};


/* ===================== CREAR NOTIFICACIÓN + EMAIL ===================== */
/* 👉 úsalo cuando se crea un pedido */
const createNotification = async ({
  userId,
  sellerId,
  messageUser,
  messageSeller,
  order,
  status
}) => {
  try {
    /* ===================== USUARIO ===================== */
    if (userId) {
      const user = await User.findById(userId);
      
      if (user) {
        // 🔔 Notificación usuario
        await Notification.create({
          user: userId,
          type: "order",
          message: messageUser,
          status,
          order: order?._id
        });

        // 📧 Correo usuario
        if (user.email) {
          try {
            await transporter.sendMail(
              notificationMail({
                to: user.email,
                subject: "📦 Actualización de tu pedido",
                message: messageUser,
                order,
                status
              })
            );
          } catch (mailError) {
            console.error("❌ Error email usuario:", mailError);
          }
        }
      }
    }

    /* ===================== VENDEDOR ===================== */
    if (sellerId) {
      const seller = await User.findById(sellerId);

      if (seller) {
        // 🔔 Notificación vendedor
        await Notification.create({
          seller: sellerId,
          type: "order",
          message: messageSeller,
          status,
          order: order?._id
        });

        // 📧 Correo vendedor
        if (seller.email) {
          try {
            await transporter.sendMail(
              notificationMail({
                to: seller.email,
                subject: "🛒 Nueva actividad en una venta",
                message: messageSeller,
                order,
                status
              })
            );
          } catch (mailError) {
            console.error("❌ Error email vendedor:", mailError);
          }
        }
      }
    }

  } catch (error) {
    console.error("❌ Error creando notificaciones:", error);
  }
};
const getSellerNotifications = async (req, res) => {
  try {
    // 1. Obtenemos el ID del vendedor logueado
    const userId = req.user.id; 

    // 2. Buscamos en el campo 'seller' (porque así lo definimos en el modelo y en el createOrder)
    const notifications = await Notification.find({ seller: userId }) // 👈 CAMBIO AQUÍ
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





module.exports = {
  getUserNotifications,
  markAsRead,
  createNotification,
  getSellerNotifications
};

// getStoreNotifications
// Obtener notificaciones de la TIENDA 
// const getStoreNotifications = async (req, res) => {
//   try {
//     const sellerId = req.user._id;

//     const notifications = await Notification.find({
//       seller: sellerId
//     })
//       .sort({ createdAt: -1 })
//       .populate("order", "total status");

//     res.json(notifications);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Error interno" });
//   }
// };