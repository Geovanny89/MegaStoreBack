const express = require('express');
const paymentController = require('../../controller/Payment/payment.controller');

const router = express();

router.post('/pagar', paymentController.createCheckoutSession);

module.exports = router;
