const Message = require("../../models/Message");
const Order = require("../../models/Order");
const { transporter, chatNotificationMail } = require("../../mailer/nodemailer");
const Notification = require("../../models/Notification");
const User = require("../../models/User");

/* ===========================
    VALIDAR ACCESO A LA ORDEN
=========================== */
const canAccessOrder = async (orderId, userId, rol) => {
  // Importante: Asegúrate que userId sea el ID del usuario logueado
  if (rol === "seller") {
    // Busca la orden donde este vendedor tenga al menos un producto
    return await Order.findOne({ _id: orderId, "products.seller": userId });
  } else {
    // Busca la orden que pertenezca al cliente
    return await Order.findOne({ _id: orderId, user: userId });
  }
};

/* ===========================
    OBTENER MENSAJES
=========================== */
const getOrderMessages = async (req, res) => {
  try {
    const { orderId } = req.params;
    // Unificamos la extracción de datos del usuario
    const userId = req.user._id || req.user.id;
    const role = req.user.rol || req.user.role; // Soporta ambos nombres por si acaso

    const order = await canAccessOrder(orderId, userId, role);
    
    if (!order) {
      console.log(`Acceso denegado: User ${userId} con rol ${role} no tiene acceso a orden ${orderId}`);
      return res.status(403).json({ message: "Acceso no autorizado" });
    }

    const messages = await Message.find({ orderId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    console.error("ERROR CRÍTICO GET:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ===========================
    ENVIAR MENSAJE
=========================== */

// controller/Messages/messageController.js

// const sendMessage = async (req, res) => {
//   try {
//     const { orderId } = req.params;
//     const { text } = req.body;
    
//     // Extraemos los datos usando exactamente los nombres de tu modelo User
//     const userId = req.user._id || req.user.id;
//     const userRole = req.user.rol; // Tu modelo usa 'rol'

//     if (!text?.trim()) {
//       return res.status(400).json({ message: "Mensaje vacío" });
//     }

//     const order = await canAccessOrder(orderId, userId, userRole);
    
//     if (!order) {
//       // Este log te dirá en la consola de Node por qué falla el 403
//       console.log(`Denegado: User ${userId} con rol ${userRole} en orden ${orderId}`);
//       return res.status(403).json({ message: "Acceso no autorizado" });
//     }

//     const message = await Message.create({
//       orderId,
//       sender: userId,
//       // Mapeamos 'user' (de tu modelo) a 'customer' (de tu enum de mensajes)
//       senderType: userRole === "seller" ? "seller" : "customer",
//       text: text.trim()
//     });

//     if (req.io) {
//       req.io.to(`order_${orderId}`).emit("newMessage", message);
//     }

//     res.status(201).json(message);
//   } catch (err) {
//     console.error("ERROR CRÍTICO POST:", err);
//     res.status(500).json({ message: "Error enviando mensaje" });
//   }
// };
// Importar lo necesario al inicio



const sendMessage = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { text } = req.body;
    const userId = req.user._id || req.user.id;
    const userRole = req.user.rol;

    if (!text?.trim()) return res.status(400).json({ message: "Mensaje vacío" });

    // 1. Validar acceso y obtener datos de la orden (Necesitamos poblar el cliente y productos para saber quién es quién)
    const order = await Order.findById(orderId).populate("user");
    if (!order) return res.status(404).json({ message: "Orden no encontrada" });

    // Determinar quién es el remitente y quién el receptor
    // El vendedor es el primer producto de la lista (ya que limitaste a un vendedor por orden)
    const sellerId = order.products[0].seller;
    const customerId = order.user._id;

    let recipientId;
    let senderName = req.user.name || "Alguien";

    if (userRole === "seller") {
      recipientId = customerId; // El vendedor le escribe al cliente
    } else {
      recipientId = sellerId;   // El cliente le escribe al vendedor
    }
    console.log("Rol del que envía:", userRole);
console.log("Buscando destinatario ID:", recipientId);

    // 2. Crear el mensaje
    const message = await Message.create({
      orderId,
      sender: userId,
      senderType: userRole === "seller" ? "seller" : "customer",
      text: text.trim()
    });

    // 3. Crear Notificación en DB para el panel
    await Notification.create({
  user: userRole === "seller" ? customerId : null,
  seller: userRole === "seller" ? null : sellerId,
  type: "message", // <--- Cambiamos "chat" por "message" que sí está en tu enum
  order: orderId,
  message: `Mensaje nuevo en orden #${orderId.toString().slice(-6)}: ${text.substring(0, 30)}...`,
  isRead: false
});

    // 4. Enviar Correo Electrónico (Asíncrono para no bloquear la respuesta)
    const recipientUser = await User.findById(recipientId);
    if (recipientUser && recipientUser.email) {
      const mailOptions = chatNotificationMail(
        recipientUser.email,
        recipientUser.name,
        senderName,
        text.trim(),
        orderId
      );
      transporter.sendMail(mailOptions).catch(err => console.error("Error mail chat:", err));
    }

    // 5. Socket.io
    if (req.io) {
      req.io.to(`order_${orderId}`).emit("newMessage", message);
    }

    res.status(201).json(message);
  } catch (err) {
    console.error("ERROR CRÍTICO POST:", err);
    res.status(500).json({ message: "Error enviando mensaje" });
  }
};
module.exports = { getOrderMessages, sendMessage };