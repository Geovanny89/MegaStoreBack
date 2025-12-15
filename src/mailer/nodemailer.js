const nodemailer = require("nodemailer");
const path = require("path");
require("dotenv").config();

const { NODEMAILER } = process.env;

/* ===================== TRANSPORTER ===================== */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "pruebadesarrollo2184@gmail.com",
    pass: NODEMAILER,
  },
});

/* ===================== CORREO BIENVENIDA (NO TOCAR) ===================== */
const mailDetails = (email, name) => {
  const currentDate = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const logoPath = path.join(
    __dirname,
    "..",
    "..",
    "..",
    "client",
    "src",
    "Assets",
    "logo-1.png"
  );

  return {
    from: "pruebadesarrollo2184@gmail.com",
    to: email,
    subject: "¡Bienvenido a JMG STORE!",
    html: `
      <div style="max-width:600px;margin:auto;font-family:Arial">
        <p>${currentDate}</p>
        <h2>Hola ${name}</h2>
        <p>Bienvenido a JMG STORE.</p>
      </div>
    `,
    attachments: [
      {
        filename: "logo-1.png",
        path: logoPath,
        cid: "logo",
      },
    ],
  };
};

/* ===================== CORREO NOTIFICACIÓN (NUEVO) ===================== */
const notificationMail = ({ email, name, message, order }) => {
  const currentDate = new Date().toLocaleString("es-CO");

  return {
    from: "pruebadesarrollo2184@gmail.com",
    to: email,
    subject: "📦 Nueva notificación de pedido",
    html: `
      <div style="max-width:600px;margin:auto;font-family:Arial">
        <p style="color:#777">${currentDate}</p>

        <h3>Hola ${name}</h3>
        <p>${message}</p>

        ${
          order
            ? `
          <div style="background:#f5f5f5;padding:12px;border-radius:6px">
            <p><strong>Pedido:</strong> ${order._id}</p>
            <p><strong>Total:</strong> $${order.total}</p>
            <p><strong>Estado:</strong> ${order.status}</p>
            <p><strong>Entrega:</strong> ${order.deliveryMethod}</p>
          </div>
        `
            : ""
        }

        <p style="margin-top:20px">
          Ingresa a tu panel de vendedor para más detalles.
        </p>
      </div>
    `,
  };
};

module.exports = {
  transporter,
  mailDetails,        // bienvenida
  notificationMail,   // notificaciones
};
