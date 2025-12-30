const mongoose = require('mongoose');
const Order = require('../../models/Order');
const Productos = require('../../models/Productos');
const User = require('../../models/User');
const { transporter, mailDetails } = require("../../mailer/nodemailer"); // nodemailer
const Notification = require('../../models/Notification');
const cloudinary = require("../../utils/cloudinary");
const detectDevice = require("../../utils/detectDevice");
const Carrito = require('../../models/Carrito');

const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await Order.find({ user: userId })
      .populate("products.product")
      .select(
        "products total status paymentMethod paymentStatus paymentInfo paymentProof device createdAt"
      )
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo órdenes" }); 
  }
};


const getMyOrdersByStore = async (req, res) => {
  try {
    const userId = req.user.id;
    const { slug } = req.params;

    const seller = await User.findOne({ slug, rol: "seller" });
    if (!seller) {
      return res.status(404).json({ message: "Tienda no encontrada" });
    }

    const orders = await Order.find({
      user: userId,
      "products.seller": seller._id // ✅ CLAVE
    })
      .populate("products.product")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo órdenes de la tienda" });
  }
};




const createOrder = async (req, res) => {
  try {
    const device = detectDevice(req);
    const userId = req.user.id;

    const {
      products,
      shippingAddress,
      deliveryMethod,
      paymentMethod
    } = req.body;

    // 1. Validaciones iniciales
    if (!products || products.length === 0) {
      return res.status(400).json({ message: "No hay productos en la orden" });
    }

    if (!deliveryMethod || !paymentMethod) {
      return res.status(400).json({ message: "Método de entrega y pago son obligatorios" });
    }

    if (deliveryMethod === "delivery" && !shippingAddress) {
      return res.status(400).json({ message: "La dirección de envío es obligatoria para domicilios" });
    }

    let total = 0;
    const orderProducts = [];
    const sellerSet = new Set();

    // 2. Procesar productos y verificar vendedor único
    for (const item of products) {
      const product = await Productos.findById(item.productId);

      if (!product) {
        return res.status(404).json({ message: `Producto no encontrado` });
      }

      total += product.price * item.quantity;

      orderProducts.push({
        product: product._id,
        productName: product.name,
        quantity: item.quantity,
        price: product.price,
        seller: product.vendedor
      });

      sellerSet.add(product.vendedor.toString());
    }

    if (sellerSet.size > 1) {
      return res.status(400).json({ message: "Solo puedes comprar a un vendedor por orden" });
    }

    const sellerId = [...sellerSet][0];
    const seller = await User.findById(sellerId);

    if (!seller || seller.rol !== "seller") {
      return res.status(400).json({ message: "El vendedor no es válido" });
    }

    // 3. Lógica de Pago Corregida (Para Estructura de Array)
    let paymentInfo = null;

    if (paymentMethod !== "cash_on_delivery") {
      const targetProvider = paymentMethod === "daviplata" ? "llaves" : paymentMethod;

      const methodData = seller.paymentMethods.find(
        (m) => m.provider.toLowerCase() === targetProvider.toLowerCase()
      );

      if (!methodData || !methodData.value) {
        return res.status(400).json({
          message: `El vendedor no tiene configurado ${paymentMethod} como método de recaudo.`
        });
      }

      paymentInfo = {
        method: paymentMethod,
        phone: methodData.value,
        qr: methodData.qr || null
      };
    }

    // 4. Crear la orden
    const order = await Order.create({
      user: userId,
      products: orderProducts,
      deliveryMethod,
      paymentMethod,
      paymentType: "manual",
      paymentStatus: "pending",
      paymentInfo,
      device,
      shippingAddress: deliveryMethod === "delivery" ? shippingAddress : null,
      total,
      status: "pending_payment"
    });

    /* ============================================================
       🔥 NUEVO: NOTIFICACIÓN PARA EL VENDEDOR
       ============================================================ */
    await Notification.create({
      seller: sellerId, // Usamos el campo seller para el panel del vendedor
      type: "order",
      order: order._id,
      message: `¡Nueva venta! El cliente ha generado la orden #${order._id}.`,
      status: "pending",
      isRead: false
    });

    // 5. Vaciar carrito del usuario
    await Carrito.findOneAndUpdate(
      { user: userId },
      { $set: { items: [] } }
    );

    res.status(201).json({
      message: "Orden creada correctamente",
      order
    });

  } catch (error) {
    console.error("Error en createOrder:", error);
    res.status(500).json({ message: "Error interno al procesar la orden" });
  }
};


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
        message: "La orden aún no ha sido enviada"
      });
    }

    if (order.paymentStatus !== "confirmed") {
      return res.status(400).json({
        message: "El pago aún no ha sido confirmado"
      });
    }

    order.status = "delivered";
    await order.save();

    // 1. Notificación para el COMPRADOR (Actualiza la existente)
    await Notification.findOneAndUpdate(
      { user: buyerId, order: order._id },
      {
        user: buyerId, // Aseguramos que se mantenga el ID del comprador
        message: `Confirmaste la recepción del pedido #${order._id}`,
        status: "delivered",
        type: "order",
        isRead: false,
        createdAt: new Date() // Esto hace que vuelva a subir al inicio en el panel
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const sellerIds = [
      ...new Set(order.products.map(p => p.seller.toString()))
    ];

    // 2. Notificación para el VENDEDOR (Actualiza la misma notificación que se creó al inicio)
    for (const sellerId of sellerIds) {
      await Notification.findOneAndUpdate(
        { seller: sellerId, order: order._id }, // Busca la notificación original de esta orden
        {
          seller: sellerId,                      // Mantiene el ID del vendedor
          message: `El comprador confirmó la recepción del pedido #${order._id}`,
          status: "delivered",                   // Cambia el estado (y el color en el front)
          type: "order",
          isRead: false,                         // La marca como nueva/no leída
          createdAt: new Date()                  // La pone de primero en la lista del vendedor
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    res.json({
      message: "Pedido marcado como recibido",
      order
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error al confirmar recepción"
    });
  }
};




const uploadPaymentProof = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        message: "Debes subir un comprobante"
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      user: userId
    });

    if (!order) {
      return res.status(404).json({
        message: "Orden no encontrada"
      });
    }

    if (order.status !== "pending_payment") {
      return res.status(400).json({
        message: "No se puede subir comprobante en este estado"
      });
    }

    const imageUrl = await new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder: "comprobantes_pago",
          resource_type: "auto"
        },
        (err, result) => {
          if (err) return reject(err);
          resolve(result.secure_url);
        }
      );
      upload.end(req.file.buffer);
    });

    order.paymentStatus = "uploaded";
    order.status = "payment_uploaded";
    order.paymentProof = {
      fileUrl: imageUrl,
      fileType: req.file.mimetype,
      uploadedAt: new Date(),
      uploadedBy: userId
    };

    await order.save();

    /* ============================================================
        🔔 ACTUALIZACIÓN: NOTIFICACIÓN PARA EL VENDEDOR (Sin duplicar)
       ============================================================ */
    const sellerId = order.products[0]?.seller;

    if (sellerId) {
      // 1. Buscamos por la combinación de orden y vendedor
      // 2. Actualizamos el mensaje y el estado
      await Notification.findOneAndUpdate(
        { order: order._id, seller: sellerId }, 
        {
          seller: sellerId,
          type: "order",
          message: `El cliente ha subido un comprobante de pago para la orden #${order._id}. Pendiente de revisión.`,
          status: "paid", // Este estado hará que cambie de color en tu frontend
          isRead: false,  // Se vuelve a poner en "no leído" para alertar al vendedor
          createdAt: new Date() // Actualizamos la fecha para que suba en la lista
        },
        { upsert: true, new: true } // upsert: true crea la notificación si es la primera vez
      );
    }

    res.json({
      message: "Comprobante enviado correctamente",
      order
    });

  } catch (error) {
    console.error("Error subiendo comprobante:", error);
    res.status(500).json({
      message: "Error al subir comprobante"
    });
  }
};




module.exports = {
  getMyOrders,
  createOrder,
    markOrderReceived,
    uploadPaymentProof,
    getMyOrdersByStore
    
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


// const createOrder = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const userEmail = req.user.email;
//     const userName = req.user.name || "Cliente";

//     const {
//       products,
//       shippingAddress,
//       deliveryMethod,
//       paymentMethod
//     } = req.body;

//     /* ================= VALIDACIONES ================= */

//     if (!products || products.length === 0) {
//       return res.status(400).json({ message: "No hay productos para procesar la orden." });
//     }

//     if (!deliveryMethod) {
//       return res.status(400).json({ message: "El método de entrega es obligatorio." });
//     }

//     if (!paymentMethod) {
//       return res.status(400).json({ message: "El método de pago es obligatorio." });
//     }

//     if (deliveryMethod === "delivery" && !shippingAddress) {
//       return res.status(400).json({
//         message: "La dirección de envío es obligatoria para entrega a domicilio."
//       });
//     }

//     if (deliveryMethod === "pickup" && paymentMethod === "cash") {
//       return res.status(400).json({
//         message: "No puedes pagar en efectivo si recoges en tienda."
//       });
//     }

//     if (deliveryMethod === "delivery" && paymentMethod === "pay_in_store") {
//       return res.status(400).json({
//         message: "No puedes pagar en tienda si el envío es a domicilio."
//       });
//     }

//     /* ================= PROCESAR PRODUCTOS ================= */

//     let total = 0;
//     const orderProducts = [];

//     for (const item of products) {
//       const product = await Productos.findById(item.productId);

//       if (!product) {
//         return res.status(404).json({
//           message: `Producto no encontrado ID: ${item.productId}`
//         });
//       }

//       total += product.price * item.quantity;

//       orderProducts.push({
//         product: product._id,
//         productName: product.name,
//         quantity: item.quantity,
//         price: product.price,
//         seller: product.vendedor
//       });
//     }

//     /* ================= CREAR ORDEN ================= */

//     const newOrder = await Order.create({
//       user: userId,
//       products: orderProducts,
//       deliveryMethod,
//       paymentMethod,
//       shippingAddress: deliveryMethod === "delivery" ? shippingAddress : null,
//       total,
//       status: "pending"
//     });

//     /* ================= EMAIL CLIENTE ================= */

//     await transporter.sendMail({
//       from: "pruebadesarrollo2184@gmail.com",
//       to: userEmail,
//       subject: `Confirmación de compra – Orden #${newOrder._id}`,
//       html: `
//         <h2>Gracias por tu compra, ${userName}</h2>
//         <p><strong>Orden:</strong> ${newOrder._id}</p>
//         <p><strong>Total:</strong> $${newOrder.total}</p>
//         <p><strong>Entrega:</strong> ${deliveryMethod}</p>
//         <p><strong>Pago:</strong> ${paymentMethod}</p>
//         <p><strong>Estado:</strong> Pendiente</p>
//       `
//     });

//     /* ================= NOTIFICAR SELLERS ================= */

//     const sellerIds = [
//       ...new Set(
//         orderProducts
//           .map(p => p.seller)
//           .filter(Boolean)
//           .map(id => id.toString())
//       )
//     ];

//     const sellers = await User.find({ _id: { $in: sellerIds } });

//     for (const seller of sellers) {
//       // 🔔 NOTIFICACIÓN (FIX: status)
//      await Notification.create({
//   user: seller._id,
//   type: "order",                 // 👈 OBLIGATORIO
//   order: newOrder._id,
//   message: `Nueva orden recibida (#${newOrder._id})`,
//   status: newOrder.status,       // pending
//   isRead: false
// });

//       // 📧 EMAIL SELLER
//       if (seller.email) {
//         await transporter.sendMail({
//           from: "pruebadesarrollo2184@gmail.com",
//           to: seller.email,
//           subject: "📦 Nueva orden recibida",
//           html: `
//             <h2>Has recibido una nueva orden</h2>
//             <p><strong>Orden:</strong> ${newOrder._id}</p>
//             <p><strong>Total:</strong> $${newOrder.total}</p>
//             <p><strong>Entrega:</strong> ${deliveryMethod}</p>
//             <p><strong>Pago:</strong> ${paymentMethod}</p>
//           `
//         });
//       }
//     }

//     return res.status(201).json({
//       message: "Orden creada exitosamente",
//       order: newOrder
//     });

//   } catch (error) {
//     console.error("Error al crear la orden:", error);
//     return res.status(500).json({
//       message: "Error interno al crear la orden."
//     });
//   }
// }