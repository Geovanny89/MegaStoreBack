const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Order = require("../models/Order");
const Carrito = require("../models/Carrito");

const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // VALIDAR QUE SEA BUFFER
    if (!Buffer.isBuffer(req.body)) {
      console.error("❌ req.body NO ES BUFFER. Stripe no puede validar la firma.");
      return res.status(400).send("Webhook Error: Body not raw");
    }

    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

    console.log("✓ Webhook validado correctamente:", event.type);

  } catch (err) {
    console.error("❌ Error verificando firma del webhook:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;

      console.log("✓ Pago completado. OrderID:", orderId);

      if (!orderId) {
        console.log("⚠️ No llegó orderId en metadata");
        return res.json({ received: true });
      }

      const order = await Order.findByIdAndUpdate(
        orderId,
        { status: "paid" },
        { new: true }
      );

      console.log("→ Orden actualizada:", order?._id);

      if (order) {
        await Carrito.findOneAndDelete({ user: order.user });
        console.log("→ Carrito eliminado del usuario", order.user);
      }
    }

    // Stripe siempre necesita recibir 200
    res.json({ received: true });

  } catch (err) {
    console.error("❌ Error procesando evento:", err);
    res.status(500).send("Server error");
  }
};

module.exports = handleStripeWebhook;
