const sellerActiveMiddleware = (req, res, next) => {
  if (req.user.rol !== "seller") return next();

  if (req.user.sellerStatus !== "active") {
    const messages = {
      pending_payment: "Debes subir el comprobante de pago",
      pending_review: "Tu pago está en revisión",
      rejected: "Tu solicitud fue rechazada",
      suspended: "Tu cuenta está suspendida"
    };

    return res.status(403).json({
      error: messages[req.user.sellerStatus] || "Tu tienda no está activa"
    });
  }

  next();
};

module.exports = { sellerActiveMiddleware };
