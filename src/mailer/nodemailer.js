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


/* ===================== CORREO BIENVENIDA (REDISEÑADO) ===================== */
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
    from: '"JMG STORE" <pruebadesarrollo2184@gmail.com>',
    to: email,
    subject: "✨ ¡Bienvenido a la familia JMG STORE! ✨",
    html: `
      <div style="max-width: 600px; margin: auto; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; color: #333;">
        
        <div style="background-color: #2563eb; padding: 30px; text-align: center;">
          <img src="cid:logo" alt="JMG STORE" style="max-width: 150px; margin-bottom: 10px;">
          <h1 style="color: white; margin: 0; font-size: 24px;">¡Hola, ${name}!</h1>
        </div>

        <div style="padding: 30px; background-color: #ffffff;">
          <p style="font-size: 14px; color: #666; margin-bottom: 20px;">${currentDate}</p>
          
          <h2 style="color: #1e40af; margin-top: 0;">¡Estamos felices de tenerte aquí!</h2>
          <p style="line-height: 1.6; color: #4b5563;">
            Gracias por unirte a <strong>JMG STORE</strong>. Hemos creado este espacio para que encuentres los mejores productos con la seguridad y confianza que mereces.
          </p>

          <div style="margin: 30px 0; padding: 20px; background-color: #f8fafc; border-radius: 8px;">
            <p style="font-weight: bold; margin-bottom: 15px; color: #1e3a8a;">¿Qué puedes hacer ahora?</p>
            <ul style="padding-left: 20px; color: #4b5563; line-height: 1.8;">
              <li>Explorar las últimas tendencias.</li>
              <li>Configurar tu perfil de usuario.</li>
              <li>Añadir tus productos favoritos a la lista de deseos.</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 35px;">
            <a href="https://tu-sitio-web.com/products" 
               style="background-color: #2563eb; color: white; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
               Empezar a Comprar
            </a>
          </div>
        </div>

        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af;">
          <p style="margin: 5px 0;">Este es un correo automático, por favor no lo respondas.</p>
          <p style="margin: 5px 0;">© 2025 JMG STORE Marketplace. Todos los derechos reservados.</p>
          <div style="margin-top: 10px;">
            <a href="#" style="color: #2563eb; text-decoration: none; margin: 0 10px;">Privacidad</a> | 
            <a href="#" style="color: #2563eb; text-decoration: none; margin: 0 10px;">Soporte</a>
          </div>
        </div>

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
