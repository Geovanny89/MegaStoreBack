const express = require('express');
const router = express.Router();
const { createCheckoutSession } = require('../controllers/stripe.controller');
const handleStripeWebhook = require('../webhooks/stripeWebhook');

// Ruta para generar la sesión
router.post('/checkout', createCheckoutSession);

// Webhook (sin JSON parser)
router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

module.exports = router;
