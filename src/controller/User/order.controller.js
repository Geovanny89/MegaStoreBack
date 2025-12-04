const mongoose = require('mongoose');
const Order = require('../../models/Order');
const Productos = require('../../models/Productos');
const User = require('../../models/User');


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


const createOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { products, shippingAddress } = req.body;

        let total = 0;
        const orderProducts = [];

        for (const item of products) {
            const product = await Productos.findById(item.productId);

            if (!product) {
                return res.status(404).json({ message: "Producto no encontrado" });
            }

            const price = product.price;

            orderProducts.push({
                product: product._id,
                quantity: item.quantity,
                price: price,           // ← ESTA ES LA CLAVE
                seller: product.owner   // si manejas marketplace
            });

            total += price * item.quantity;
        }

        const newOrder = await Order.create({
            user: userId,
            products: orderProducts,
            shippingAddress,
            total
        });

        return res.status(201).json(newOrder);

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Error al crear orden" });
    }
};




// **    enpoind para completar la compra // 
//   COLPETAR ORDEN //


module.exports = {
    getMyOrders,
    createOrder,
   
    
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





