const mongoose = require("mongoose");
const { transporter } = require("../../mailer/nodemailer");
const Order = require("../../models/Order");
const Notification = require("../../models/Notification");
const Productos = require("../../models/Productos");

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
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderId } = req.params;
    const sellerId = req.user.id;

    const order = await Order.findOne({
      _id: orderId,
      "products.seller": sellerId
    })
      .populate("products.product user")
      .session(session);

    if (!order) {
      throw new Error("Orden no encontrada");
    }

    if (order.paymentStatus === "confirmed") {
      throw new Error("Pago ya confirmado");
    }

    // 🔒 VALIDACIÓN CLAVE
    if (
      order.paymentMethod !== "cash_on_delivery" &&
      (!order.paymentProof || !order.paymentProof.fileUrl)
    ) {
      throw new Error("No se puede confirmar el pago sin comprobante");
    }

    /* =====================================
       🔥 DESCONTAR STOCK
    ===================================== */
    for (const item of order.products) {
      if (item.seller.toString() !== sellerId) continue;

      const result = await Productos.updateOne(
        { _id: item.product._id, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { session }
      );

      if (result.modifiedCount === 0) {
        throw new Error(`Stock insuficiente para ${item.product.name}`);
      }
    }

    order.paymentStatus = "confirmed";
    order.status =
      order.paymentMethod === "cash_on_delivery"
        ? "delivered"
        : "processing";

    await order.save({ session });

    await Notification.create(
      [{
        user: order.user._id,
        type: "order",
        order: order._id,
        message: `Tu pago del pedido #${order._id} fue confirmado.`,
        status: order.status,
        isRead: false
      }],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.json({ message: "Pago confirmado y stock actualizado", order });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("❌ Error confirmando pago:", error);
    res.status(400).json({ message: error.message });
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
