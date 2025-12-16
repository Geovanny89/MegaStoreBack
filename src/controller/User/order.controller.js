const mongoose = require('mongoose');
const Order = require('../../models/Order');
const Productos = require('../../models/Productos');
const User = require('../../models/User');
const { transporter, mailDetails } = require("../../mailer/nodemailer"); // nodemailer
const Notification = require('../../models/Notification');


const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await Order.find({ user: userId })
      .populate("products.product");

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error obteniendo órdenes" });
  }
};


// const createOrder = async (req, res) => {
//     try {
//         const userId = req.user.id;
//         const { products, shippingAddress } = req.body;

//         let total = 0;
//         const orderProducts = [];

//         for (const item of products) {
//             const product = await Productos.findById(item.productId);

//             if (!product) {
//                 return res.status(404).json({ message: "Producto no encontrado" });
//             }

//             const price = product.price;

//             orderProducts.push({
//                 product: product._id,
//                 quantity: item.quantity,
//                 price: price,           // ← ESTA ES LA CLAVE
//                 seller: product.owner   // si manejas marketplace
//             });

//             total += price * item.quantity;
//         }

//         const newOrder = await Order.create({
//             user: userId,
//             products: orderProducts,
//             shippingAddress,
//             total
//         });

//         return res.status(201).json(newOrder);

//     } catch (error) {
//         console.log(error);
//         return res.status(500).json({ message: "Error al crear orden" });
//     }
// };


const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    const userName = req.user.name || "Cliente";

    const {
      products,
      shippingAddress,
      deliveryMethod,
      paymentMethod
    } = req.body;

    /* ================= VALIDACIONES ================= */

    if (!products || products.length === 0) {
      return res.status(400).json({ message: "No hay productos para procesar la orden." });
    }

    if (!deliveryMethod) {
      return res.status(400).json({ message: "El método de entrega es obligatorio." });
    }

    if (!paymentMethod) {
      return res.status(400).json({ message: "El método de pago es obligatorio." });
    }

    if (deliveryMethod === "delivery" && !shippingAddress) {
      return res.status(400).json({
        message: "La dirección de envío es obligatoria para entrega a domicilio."
      });
    }

    if (deliveryMethod === "pickup" && paymentMethod === "cash") {
      return res.status(400).json({
        message: "No puedes pagar en efectivo si recoges en tienda."
      });
    }

    if (deliveryMethod === "delivery" && paymentMethod === "pay_in_store") {
      return res.status(400).json({
        message: "No puedes pagar en tienda si el envío es a domicilio."
      });
    }

    /* ================= PROCESAR PRODUCTOS ================= */

    let total = 0;
    const orderProducts = [];

    for (const item of products) {
      const product = await Productos.findById(item.productId);

      if (!product) {
        return res.status(404).json({
          message: `Producto no encontrado ID: ${item.productId}`
        });
      }

      total += product.price * item.quantity;

      orderProducts.push({
        product: product._id,
        productName: product.name,
        quantity: item.quantity,
        price: product.price,
        seller: product.vendedor
      });
    }

    /* ================= CREAR ORDEN ================= */

    const newOrder = await Order.create({
      user: userId,
      products: orderProducts,
      deliveryMethod,
      paymentMethod,
      shippingAddress: deliveryMethod === "delivery" ? shippingAddress : null,
      total,
      status: "pending"
    });

    /* ================= EMAIL CLIENTE ================= */

    await transporter.sendMail({
      from: "pruebadesarrollo2184@gmail.com",
      to: userEmail,
      subject: `Confirmación de compra – Orden #${newOrder._id}`,
      html: `
        <h2>Gracias por tu compra, ${userName}</h2>
        <p><strong>Orden:</strong> ${newOrder._id}</p>
        <p><strong>Total:</strong> $${newOrder.total}</p>
        <p><strong>Entrega:</strong> ${deliveryMethod}</p>
        <p><strong>Pago:</strong> ${paymentMethod}</p>
        <p><strong>Estado:</strong> Pendiente</p>
      `
    });

    /* ================= NOTIFICAR SELLERS ================= */

    const sellerIds = [
      ...new Set(
        orderProducts
          .map(p => p.seller)
          .filter(Boolean)
          .map(id => id.toString())
      )
    ];

    const sellers = await User.find({ _id: { $in: sellerIds } });

    for (const seller of sellers) {
      // 🔔 NOTIFICACIÓN (FIX: status)
      await Notification.create({
        user: seller._id,
        order: newOrder._id,
        message: `Nueva orden recibida (#${newOrder._id})`,
        status: newOrder.status // pending
      });

      // 📧 EMAIL SELLER
      if (seller.email) {
        await transporter.sendMail({
          from: "pruebadesarrollo2184@gmail.com",
          to: seller.email,
          subject: "📦 Nueva orden recibida",
          html: `
            <h2>Has recibido una nueva orden</h2>
            <p><strong>Orden:</strong> ${newOrder._id}</p>
            <p><strong>Total:</strong> $${newOrder.total}</p>
            <p><strong>Entrega:</strong> ${deliveryMethod}</p>
            <p><strong>Pago:</strong> ${paymentMethod}</p>
          `
        });
      }
    }

    return res.status(201).json({
      message: "Orden creada exitosamente",
      order: newOrder
    });

  } catch (error) {
    console.error("Error al crear la orden:", error);
    return res.status(500).json({
      message: "Error interno al crear la orden."
    });
  }
}
const markOrderReceived = async (req, res) => {
  try {
    const { orderId } = req.params;
    const buyerId = req.user.id;

    const order = await Order.findOne({
      _id: orderId,
      user: buyerId
    });

    if (!order) {
      return res.status(404).json({ message: "Orden no encontrada" });
    }

    if (order.status !== "shipped") {
      return res.status(400).json({
        message: "Solo puedes confirmar órdenes enviadas"
      });
    }

    // 🔄 Cambiar estado
    order.status = "delivered";
    await order.save();

    // ============================
    // 🔔 NOTIFICACIÓN AL COMPRADOR
    // ============================
    await Notification.findOneAndUpdate(
      { user: buyerId, order: order._id },
      {
        message: `Confirmaste la recepción del pedido #${order._id}`,
        status: "delivered",
        isRead: false
      },
      { upsert: true, new: true }
    );

    // ============================
    // 🔔 NOTIFICACIÓN A VENDEDORES
    // ============================
    const sellerIds = [
      ...new Set(order.products.map(p => p.seller.toString()))
    ];

    for (const sellerId of sellerIds) {
      await Notification.findOneAndUpdate(
        { user: sellerId, order: order._id },
        {
          message: `El comprador confirmó la recepción del pedido #${order._id}`,
          status: "delivered",
          isRead: false
        },
        { upsert: true, new: true }
      );
    }

    // 💰 AQUÍ luego liberas el pago al vendedor
    console.log("Liberar pago al vendedor");

    res.json({
      message: "Pedido confirmado como recibido",
      order
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error al confirmar recepción"
    });
  }
};



// **    enpoind para completar la compra // 
//   COLPETAR ORDEN //


module.exports = {
    getMyOrders,
    createOrder,
    markOrderReceived
    
};
// const completeOrder = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const userId = req.user.id;

//         const order = await Order.findById(id).populate('products.product');

//         if (!order) return res.status(404).json({ message: "Orden no encontrada" });

//         if (order.user.toString() !== userId.toString())
//             return res.status(403).json({ message: "No autorizado" });

//         if (order.status !== "pending")
//             return res.status(400).json({ message: "La orden ya fue procesada o cancelada." });

//         // ✅ Crear sesión de Stripe
//         const lineItems = order.products.map(item => ({
//             price_data: {
//                 currency: 'usd',
//                 product_data: {
//                     name: item.product.name,
//                     images: [item.product.image],
//                 },
//                 unit_amount: Math.round(item.price * 100),
//             },
//             quantity: item.quantity,
//         }));

//         const session = await stripe.checkout.sessions.create({
//             payment_method_types: ['card'],
//             line_items: lineItems,
//             mode: 'payment',
//             success_url: `${process.env.FRONT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
//             cancel_url: `${process.env.FRONT_URL}/cancel`,
//             metadata: { orderId: order._id.toString() },
//         });

//         res.status(200).json({ url: session.url }); // ⚠ Aquí devuelves la URL de Stripe
//     } catch (error) {
//         console.log(error);
//         return res.status(500).json({ message: "Error al iniciar pago" });
//     }
// };
// const normalizeImages = (imageField) => {
//   if (!imageField) return [];
//   if (typeof imageField === 'string') return [imageField];
//   if (Array.isArray(imageField)) return imageField.filter(url => typeof url === 'string');
//   if (typeof imageField === 'object') return Object.values(imageField).flat().filter(url => typeof url === 'string');
//   return [];
// };
// const completeOrder = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const userId = req.user.id;

//     const order = await Order.findById(id).populate('products.product');

//     if (!order) return res.status(404).json({ message: "Orden no encontrada" });
//     if (order.user.toString() !== userId.toString()) return res.status(403).json({ message: "No autorizado" });
//     if (order.status !== "pending") return res.status(400).json({ message: "La orden ya fue procesada o cancelada." });

//     const lineItems = order.products.map(item => ({
//       price_data: {
//         currency: 'usd',
//         product_data: {
//           name: item.product.name,
//           images: normalizeImages(item.product.image),
//         },
//         unit_amount: Math.round(item.price * 100),
//       },
//       quantity: item.quantity,
//     }));

//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ['card'],
//       line_items: lineItems,
//       mode: 'payment',
//       success_url: `${process.env.FRONT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
//       cancel_url: `${process.env.FRONT_URL}/cancel`,
//       metadata: { orderId: order._id.toString() },
//     });

//     res.status(200).json({ url: session.url });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: "Error al iniciar pago", error: error.message });
//   }
// };





