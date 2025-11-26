const Order = require('../models/Order');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const createCheckoutSession = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId).populate('products.product');
    if (!order) return res.status(404).json({ message: "Orden no encontrada" });

    const lineItems = order.products.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.product.name,
          images: [item.product.image]
        },
        unit_amount: Math.round(item.price * 100)
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url: `${process.env.FRONT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONT_URL}/cancel`,
      metadata: {
        orderId: order._id.toString(),
      }
    });

    res.json({ id: session.id });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al crear sesión de pago" });
  }
};

module.exports = { createCheckoutSession };
