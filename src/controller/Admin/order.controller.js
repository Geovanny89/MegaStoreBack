const mongoose = require("mongoose");
const { transporter } = require("../../mailer/nodemailer");
const Order = require("../../models/Order");
const Notification = require("../../models/Notification");

/* ============================================================
   UTIL: crear o actualizar notificación de orden
============================================================ */
const upsertOrderNotification = async ({ userId, order, message }) => {
  await Notification.findOneAndUpdate(
    { user: userId, order: order._id },
    {
      message,
      status: order.status,
      isRead: false
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }
  );
};

/* ============================================================
   1. VENDEDOR: Ver solo sus órdenes
============================================================ */
const getSellerOrders = async (req, res) => {
  try {
    const sellerId = new mongoose.Types.ObjectId(req.user.id);

    const orders = await Order.aggregate([
      { $match: { "products.seller": sellerId } },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $addFields: {
          user: { $arrayElemAt: ["$user", 0] },
          products: {
            $filter: {
              input: "$products",
              as: "p",
              cond: { $eq: ["$$p.seller", sellerId] }
            }
          }
        }
      }
    ]);

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo órdenes" });
  }
};


/* ============================================================
   2. VENDEDOR: Marcar orden en PROCESSING
============================================================ */
const markOrderProcessing = async (req, res) => {
  try {
    const { orderId } = req.params;
    const sellerId = req.user.id;

    const order = await Order.findOne({
      _id: orderId,
      "products.seller": sellerId
    });

    if (!order) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }

    if (order.paymentStatus !== "confirmed") {
      return res.status(400).json({
        message: "Pago no confirmado"
      });
    }

    order.status = "processing";
    await order.save();

    await upsertOrderNotification({
      userId: order.user,
      order,
      message: `Tu pedido #${order._id} está en preparación`
    });

    res.json({ message: "Orden en procesamiento", order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al procesar orden" });
  }
};


/* ============================================================
   3. VENDEDOR: Marcar orden como SHIPPED
============================================================ */
const markOrderShipped = async (req, res) => {
  try {
    const { orderId } = req.params;
    const sellerId = req.user.id;

    const order = await Order.findOne({
      _id: orderId,
      "products.seller": sellerId
    }).populate("user");

    if (!order) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }

    if (order.status !== "processing") {
      return res.status(400).json({
        message: "La orden debe estar en procesamiento"
      });
    }

    order.status = "shipped";
    await order.save();

    await transporter.sendMail({
      from: "no-reply@megastore.com",
      to: order.user.email,
      subject: `Pedido enviado`,
      html: `<p>Tu pedido #${order._id} fue enviado.</p>`
    });

    await upsertOrderNotification({
      userId: order.user._id,
      order,
      message: `Tu pedido #${order._id} fue enviado`
    });

    res.json({ message: "Orden enviada", order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al enviar orden" });
  }
};



/* ============================================================
   CONFIRMAR PAGO (Control Manual Total)
============================================================ */
const confirmPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const sellerId = req.user.id;

    const order = await Order.findOne({
      _id: orderId,
      "products.seller": sellerId
    }).populate("user");

    if (!order) return res.status(404).json({ message: "Orden no encontrada" });

    // Actualizamos ambos estados según tu Schema
    order.paymentStatus = "confirmed"; //
    
    // Si es contraentrega va a entregado, si no, a preparación
    if (order.paymentMethod === "cash_on_delivery") {
      order.status = "delivered";
    } else {
      order.status = "processing"; // Estado correcto según tu Schema
    }

    await order.save();

    await upsertOrderNotification({
      userId: order.user._id,
      order,
      message: `Tu pago del pedido #${order._id} fue confirmado.`
    });

    res.json({ message: "Pago confirmado", order });
  } catch (error) {
    res.status(500).json({ message: "Error al confirmar" });
  }
};

const rejectPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const sellerId = req.user.id;

    const order = await Order.findOne({
      _id: orderId,
      "products.seller": sellerId
    }).populate("user");

    if (!order) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }

    order.paymentStatus = "rejected";
    order.paymentRejectionReason = reason || "Pago fraudulento";
    order.status = "cancelled";
    await order.save();

    // 🔔 Notificación
    await upsertOrderNotification({
      userId: order.user._id,
      order,
      message: `Tu pago del pedido #${order._id} fue rechazado. Motivo: ${order.paymentRejectionReason}`
    });

    res.json({
      message: "Pago rechazado por posible fraude",
      order
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al rechazar pago" });
  }
};

module.exports = {
  getSellerOrders,
  markOrderProcessing,
  markOrderShipped,
  confirmPayment,
  rejectPayment
};
