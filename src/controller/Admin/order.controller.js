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
          from: "productos",
          localField: "products.product",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      {
        $addFields: {
          products: {
            $map: {
              input: {
                $filter: {
                  input: "$products",
                  as: "p",
                  cond: { $eq: ["$$p.seller", sellerId] }
                }
              },
              as: "prod",
              in: {
                product: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$productDetails",
                        as: "detail",
                        cond: { $eq: ["$$detail._id", "$$prod.product"] }
                      }
                    },
                    0
                  ]
                },
                quantity: "$$prod.quantity",
                price: "$$prod.price",
                seller: "$$prod.seller"
              }
            }
          },
          user: { $arrayElemAt: ["$userDetails", 0] }
        }
      },
      {
        $project: {
          productDetails: 0,
          userDetails: 0
        }
      }
    ]);

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo órdenes del vendedor." });
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

    if (order.status !== "paid") {
      return res.status(400).json({ message: "La orden debe estar paga" });
    }

    order.status = "processing";
    await order.save();

    await upsertOrderNotification({
      userId: order.user,
      order,
      message: `Tu pedido #${order._id} está en preparación.`
    });

    res.json({ message: "Orden en procesamiento", order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar orden" });
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
    })
      .populate("user")
      .populate("products.product");

    if (!order) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }

    if (order.status !== "processing") {
      return res.status(400).json({ message: "La orden debe estar en procesamiento" });
    }

    order.status = "shipped";
    await order.save();

    // 📧 Email
    await transporter.sendMail({
      from: "pruebadesarrollo2184@gmail.com",
      to: order.user.email,
      subject: `Pedido enviado - Orden #${order._id}`,
      html: `<p>Tu pedido ha sido enviado.</p>`
    });

    await upsertOrderNotification({
      userId: order.user._id,
      order,
      message: `Tu pedido #${order._id} fue enviado.`
    });

    res.json({ message: "Orden enviada", order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al enviar orden" });
  }
};

/* ============================================================
   4. COMPRADOR: Confirmar DELIVERED
============================================================ */
const markOrderDelivered = async (req, res) => {
  try {
    const { orderId } = req.params;
    const buyerId = req.user.id;

    const order = await Order.findOne({
      _id: orderId,
      user: buyerId
    }).populate("products.seller");

    if (!order) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }

    if (order.status !== "shipped") {
      return res.status(400).json({ message: "La orden debe estar enviada" });
    }

    // 🔄 Cambiar estado
    order.status = "delivered";
    await order.save();

    // ============================
    // NOTIFICACIÓN AL COMPRADOR
    // ============================
    await upsertOrderNotification({
      userId: order.user,
      order,
      message: `Confirmaste la entrega del pedido #${order._id}.`
    });

    // ============================
    // NOTIFICACIÓN A VENDEDORES
    // ============================
    const sellerIds = [
      ...new Set(order.products.map(p => p.seller.toString()))
    ];

    for (const sellerId of sellerIds) {
      await upsertOrderNotification({
        userId: sellerId,
        order,
        message: `El comprador confirmó la entrega del pedido #${order._id}.`
      });
    }

    res.json({ message: "Orden entregada", order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al confirmar entrega" });
  }
};


module.exports = {
  getSellerOrders,
  markOrderProcessing,
  markOrderShipped,
  markOrderDelivered
};
