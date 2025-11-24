const Order = require('../../models/Order');

require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const createCheckoutSession = async (req, res) => {
  try {
    const { orderId, success_url, cancel_url } = req.body;

    // Obtén la información de la orden desde tu base de datos
    const order = await Order.findById(orderId).populate('products.product'); // Asegúrate de tener la relación adecuada en tu modelo Order

    if (!order) {
      res.status(404).json({ message: 'No se encontró la orden' });
      return;
    }

    // Construye el objeto de línea de artículos (line_items) basado en los productos de la orden
    const lineItems = order.products.map((product) => ({
      price_data: {
        currency: 'usd', // o tu moneda preferida
        product_data: {
          name: product.product.name,
          images: [product.product.image], // Puedes ajustar esto según tus modelos y cómo almacenas las imágenes
        },
        unit_amount: product.product.price * 10, // La cantidad debe estar en centavos
      },
      quantity: product.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url,
      cancel_url,
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error('Error al crear la sesión de pago:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = {
  createCheckoutSession,
};
