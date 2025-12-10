const { default: mongoose } = require("mongoose");
const { mailDetails, transporter } = require("../../mailer/nodemailer");
const Order = require("../../models/Order");

/* ============================================================
   1. VENDEDOR: Ver solo sus órdenes
   ============================================================ */

const getSellerOrders = async (req, res) => {
  try {
    const sellerId = new mongoose.Types.ObjectId(req.user.id);

    const orders = await Order.aggregate([
      // 1) Filtrar órdenes que tienen al menos un producto de este seller
      { $match: { "products.seller": sellerId } },

      // 2) Traer detalles de los productos referenciados en la orden
      {
        $lookup: {
          from: "productos", // revisa el nombre de la colección si es distinto
          localField: "products.product",
          foreignField: "_id",
          as: "productDetails"
        }
      },

      // 3) Traer datos del usuario comprador
      {
        $lookup: {
          from: "users", // revisa el nombre de la colección de usuarios si es distinto
          localField: "user",
          foreignField: "_id",
          as: "userDetails"
        }
      },

      // 4) Filtrar products para quedarse solo con los del seller y "enriquecer" con productDetails
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
          // traer user como objeto en lugar de array
          user: { $arrayElemAt: ["$userDetails", 0] }
        }
      },

      // 5) Limpiar campos que ya no necesitamos
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

module.exports = { getSellerOrders };


/* ============================================================
   2. VENDEDOR: Poner orden en Processing
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
      return res.status(404).json({ message: "Orden no encontrada para este vendedor" });
    }

    if (order.status !== "paid") {
      return res.status(400).json({ message: "La orden debe estar paga para procesarse." });
    }

    order.status = "processing";
    await order.save();

    res.json({ message: "Orden marcada como en procesamiento", order });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar orden." });
  }
};

/* ============================================================
   3. VENDEDOR: Marcar como Shipped
   ============================================================ */
const markOrderShipped = async (req, res) => {
  try {
    const { orderId } = req.params;
    const sellerId = req.user.id;

    // Buscar orden que incluya este vendedor
    const order = await Order.findOne({
      _id: orderId,
      "products.seller": sellerId
    })
      .populate("user")          // comprador
      .populate("products.product"); // información de productos

    if (!order) {
      return res.status(404).json({ message: "Orden no encontrada para este vendedor" });
    }

    if (order.status !== "processing") {
      return res.status(400).json({ message: "La orden debe estar en procesamiento." });
    }

    // Actualizar estado
    order.status = "shipped";
    await order.save();

    // Preparar lista de productos en HTML
    const productListHTML = order.products
      .map(p => `<li>${p.product.name} x ${p.quantity} - $${p.price}</li>`)
      .join("");

    // Enviar correo al comprador
    await transporter.sendMail({
      from: "pruebadesarrollo2184@gmail.com",
      to: order.user.email, // correo del comprador
      subject: `Tu pedido ha sido enviado - Orden #${order._id}`,
      html: `
        <h2>¡Tu pedido ha sido enviado, ${order.user.name}!</h2>
        <p>Tu orden está en camino. Aquí tienes los detalles:</p>
        <ul>${productListHTML}</ul>
        <p><strong>Total pagado:</strong> $${order.total}</p>
        <p>Estado actual: Enviado</p>
      `
    });

    res.json({ message: "Orden marcada como enviada y correo enviado al comprador", order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar orden o enviar correo." });
  }
};

/* ============================================================
   4. COMPRADOR: Confirmar Delivered
   ============================================================ */
const markOrderDelivered = async (req, res) => {
  try {
    const { orderId } = req.params;
    const buyerId = req.user.id;

    const order = await Order.findOne({
      _id: orderId,
      user: buyerId
    });

    if (!order) {
      return res.status(404).json({ message: "Orden no encontrada para este comprador" });
    }

    if (order.status !== "shipped") {
      return res.status(400).json({ message: "La orden debe estar enviada para confirmarse." });
    }

    order.status = "delivered";
    await order.save();

    console.log("Liberar dinero al vendedor");

    res.json({ message: "Orden marcada como entregada", order });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar orden." });
  }
};

module.exports = {
  getSellerOrders,
  markOrderProcessing,
  markOrderShipped,
  markOrderDelivered,
};
