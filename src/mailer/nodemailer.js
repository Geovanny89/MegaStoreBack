const nodemailer = require("nodemailer");
const path = require("path");
require("dotenv").config();

// Extraemos las nuevas variables de Hostinger
const { EMAIL_USER, EMAIL_PASS } = process.env;

/* ===================== TRANSPORTER (HOSTINGER) ===================== */
const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true, // SSL
  auth: {
    user: EMAIL_USER, // Tu correo oficial: ejemplo@k-dice.com
    pass: EMAIL_PASS, // Tu contraseña de Hostinger
  },
  tls: {
    rejectUnauthorized: false // Evita problemas de certificados en el VPS
  }
});

// Definimos el remitente oficial para todas las plantillas
const OFFICIAL_FROM = `"K-DICE Marketplace" <${EMAIL_USER}>`;
const logoPath = path.join(__dirname, "..", "..", "assets", "logo3.png");

/* ===================== CORREO BIENVENIDA (REDISEÑADO) ===================== */
const mailDetails = (email, name) => {
  const currentDate = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return {
    from: OFFICIAL_FROM,
    to: email,
    subject: "Bienvenido a K-DICE | Tu experiencia premium en marketplace",
    html: `
      <div style="max-width: 600px; margin: auto; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; border: 1px solid #eee; border-radius: 16px; overflow: hidden; color: #2d3748; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="background: linear-gradient(135deg, #10b981 0%, #047857 100%); padding: 40px 20px; text-align: center;">
          <img src="cid:logo" alt="K-DICE Logo" style="max-width: 140px; margin-bottom: 20px;">
          <h1 style="color: white; margin: 0; font-size: 26px; font-weight: 300; letter-spacing: 1px;">Bienvenido, ${name}</h1>
        </div>
        <div style="padding: 40px; background-color: #ffffff;">
          <p style="font-size: 12px; color: #a0aec0; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 25px;">${currentDate}</p>
          <h2 style="color: #065f46; margin-top: 0; font-size: 22px; font-weight: 600;">Una nueva etapa comienza hoy.</h2>
          <p style="line-height: 1.8; color: #4a5568; font-size: 16px;">
            Es un placer darte la bienvenida a <strong>K-DICE</strong>. Nos esforzamos por ofrecerte una plataforma donde la calidad y la seguridad convergen para brindarte la mejor experiencia de compra y venta en nuestro marketplace.
          </p>
          <div style="margin: 35px 0; padding: 25px; border-left: 4px solid #10b981; background-color: #f0fdf4; border-radius: 0 8px 8px 0;">
            <p style="font-weight: bold; margin-bottom: 15px; color: #064e3b; font-size: 15px;">Primeros pasos en su cuenta:</p>
            <ul style="padding-left: 20px; color: #374151; line-height: 2; font-size: 14px;">
              <li>Descubre productos seleccionados de alta gama.</li>
              <li>Personaliza tu entorno y preferencias de seguridad.</li>
              <li>Gestiona tus listas de deseos y seguimiento de pedidos.</li>
            </ul>
          </div>
          <div style="text-align: center; margin-top: 40px;">
            <a href="https://www.k-dice.com" 
               style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 16px 35px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
               Explorar K-DICE
            </a>
          </div>
        </div>
        <div style="background-color: #f9fafb; padding: 30px; text-align: center; font-size: 12px; color: #718096; border-top: 1px solid #edf2f7;">
          <p style="margin: 5px 0;">Has recibido este correo como parte de tu registro en K-DICE.</p>
          <p style="margin: 5px 0; font-weight: bold;">© 2026 K-DICE Marketplace. Excelencia en cada detalle.</p>
        </div>
      </div>
    `,
    attachments: [{ filename: "logo3.png", path: logoPath, cid: "logo" }],
  };
};

/* ===================== CORREO NOTIFICACIÓN (NUEVO) ===================== */
const notificationMail = ({ email, name, message, order }) => {
  const currentDate = new Date().toLocaleString("es-CO");

  return {
    from: OFFICIAL_FROM,
    to: email,
    subject: "📦 Nueva notificación de pedido",
    html: `
      <div style="max-width:600px;margin:auto;font-family:Arial">
        <p style="color:#777">${currentDate}</p>
        <h3>Hola ${name}</h3>
        <p>${message}</p>
        ${order ? `
          <div style="background:#f5f5f5;padding:12px;border-radius:6px">
            <p><strong>Pedido:</strong> ${order._id}</p>
            <p><strong>Total:</strong> $${order.total}</p>
            <p><strong>Estado:</strong> ${order.status}</p>
          </div>` : ""}
        <p style="margin-top:20px">Ingresa a tu panel para más detalles.</p>
      </div>
    `,
  };
};

/* ===================== CORREO BIENVENIDA VENDEDOR ===================== */
const welcomeSellerMail = (email, name) => {
  return {
    from: OFFICIAL_FROM,
    to: email,
    subject: "Confirmación de Registro: Su portal de vendedor en K-DICE está activo",
    html: `
      <div style="max-width: 600px; margin: auto; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; color: #1a202c; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
        <div style="background: linear-gradient(135deg, #059669 0%, #064e3b 100%); padding: 45px 20px; text-align: center;">
          <img src="cid:logo" alt="K-DICE Business" style="max-width: 130px; margin-bottom: 20px;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 300; letter-spacing: 0.5px;">Bienvenido al Ecosistema K-DICE</h1>
        </div>
        <div style="padding: 40px; background-color: #ffffff;">
          <h2 style="color: #065f46; margin-top: 0; font-size: 20px; font-weight: 600;">Estimado/a ${name},</h2>
          <p style="line-height: 1.8; color: #4a5568; font-size: 15px;">
            Es un placer informarle que su cuenta de <strong>Socio Comercial</strong> ha sido activada con éxito.
          </p>
          <div style="margin: 30px 0; padding: 25px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #edf2f7;">
            <p style="font-weight: bold; margin-bottom: 15px; color: #064e3b; font-size: 14px;">Módulo de Gestión Profesional:</p>
            <ul style="font-size: 14px; color: #4a5568;">
              <li>✔️ Catálogo de productos.</li>
              <li>✔️ Logística en tiempo real.</li>
              <li>✔️ Analítica de ventas.</li>
            </ul>
          </div>
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://vendedores.k-dice.com" 
               style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: 600;">
               Acceder al Panel de Control
            </a>
          </div>
        </div>
        <div style="background-color: #f1f5f9; padding: 30px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
          <p>© 2026 K-DICE Marketplace </p>
        </div>
      </div>
    `,
    attachments: [{ filename: "logo3.png", path: logoPath, cid: "logo" }],
  };
};
/* ===================== CORREO NUEVA VENTA (VENDEDOR) ===================== */
const sellerNewOrderMail = (sellerEmail, sellerName, order) => {
  const currentDate = new Date().toLocaleString("es-CO");
  
  // Mapeo de productos para la tabla
  const productRows = order.products.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #edf2f7;">${item.productName}</td>
      <td style="padding: 10px; border-bottom: 1px solid #edf2f7; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #edf2f7; text-align: right;">$${item.price.toLocaleString()}</td>
    </tr>
  `).join('');

  return {
    from: OFFICIAL_FROM,
    to: sellerEmail,
    subject: `💰 ¡Nueva Venta Realizada! - Orden #${order._id.toString().slice(-6)}`,
    html: `
      <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #064e3b; padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 22px;">¡Tienes una nueva venta!</h1>
          <p style="opacity: 0.9;">Orden ID: ${order._id}</p>
        </div>
        <div style="padding: 30px; background-color: white;">
          <p>Hola <strong>${sellerName}</strong>,</p>
          <p>Se ha generado una nueva orden en tu tienda. Aquí están los detalles:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #f8fafc;">
                <th style="padding: 10px; text-align: left;">Producto</th>
                <th style="padding: 10px; text-align: center;">Cant.</th>
                <th style="padding: 10px; text-align: right;">Precio</th>
              </tr>
            </thead>
            <tbody>
              ${productRows}
            </tbody>
          </table>

          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin-top: 20px;">
            <p style="margin: 5px 0;"><strong>Total a recibir:</strong> $${order.total.toLocaleString()}</p>
            <p style="margin: 5px 0;"><strong>Método de pago:</strong> ${order.paymentMethod}</p>
            <p style="margin: 5px 0;"><strong>Entrega:</strong> ${order.deliveryMethod === 'delivery' ? 'Domicilio' : 'Retiro en punto'}</p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="https://www.k-dice.com/orders" 
               style="background-color: #10b981; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">
               Gestionar Pedido
            </a>
          </div>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #64748b;">
          Este es un aviso automático de K-DICE Marketplace.
        </div>
      </div>
    `,
    attachments: [{ filename: "logo3.png", path: logoPath, cid: "logo" }],
  };
};
/* ===================== CORREO NUEVO MENSAJE DE CHAT ===================== */
const chatNotificationMail = (toEmail, toName, senderName, messageText, orderId) => {
  return {
    from: OFFICIAL_FROM,
    to: toEmail,
    subject: `💬 Nuevo mensaje de ${senderName} en la orden #${orderId.toString().slice(-6)}`,
    html: `
      <div style="max-width: 500px; margin: auto; font-family: sans-serif; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #10b981; padding: 20px; text-align: center; color: white;">
          <h2 style="margin: 0;">¡Tienes un nuevo mensaje!</h2>
        </div>
        <div style="padding: 30px;">
          <p>Hola <strong>${toName}</strong>,</p>
          <p>Has recibido un nuevo mensaje sobre la orden <strong>#${orderId}</strong>:</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; font-style: italic; color: #374151; border-left: 4px solid #10b981;">
            "${messageText}"
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="https://www.k-dice.com/orders/${orderId}" 
               style="background-color: #064e3b; color: white; padding: 12px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
               Responder en el Chat
            </a>
          </div>
        </div>
      </div>
    `
  };
};

/* ===================== CORREO COMPROBANTE RECIBIDO ===================== */
const paymentProofNotificationMail = (sellerEmail, sellerName, orderId, buyerName) => {
  return {
    from: OFFICIAL_FROM,
    to: sellerEmail,
    subject: `💳 Comprobante de pago recibido - Orden #${orderId.toString().slice(-6)}`,
    html: `
      <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #1e40af; padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 22px;">Nuevo Comprobante de Pago</h1>
          <p style="opacity: 0.9;">Orden ID: ${orderId}</p>
        </div>
        <div style="padding: 30px; background-color: white;">
          <p>Hola <strong>${sellerName}</strong>,</p>
          <p>El cliente <strong>${buyerName}</strong> ha subido el comprobante de pago para la orden indicada.</p>
          
          <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1e40af;">
            <p style="margin: 0; color: #1e3a8a;"><strong>Acción requerida:</strong> Por favor, ingresa a tu panel de vendedor para verificar el comprobante y marcar el pago como confirmado.</p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="https://www.k-dice.com/ordenes/${orderId}" 
               style="background-color: #1e40af; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
               Ver Comprobante en Panel
            </a>
          </div>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #64748b;">
          Este es un aviso automático de K-DICE Marketplace.
        </div>
      </div>
    `,
    attachments: [{ filename: "logo3.png", path: logoPath, cid: "logo" }],
  };
};

// Recuerda agregar 'paymentProofNotificationMail' al module.exports
// No olvides añadirlo al module.exports
module.exports = {
  transporter,
  mailDetails,
  notificationMail,
  welcomeSellerMail,
  sellerNewOrderMail,
  chatNotificationMail,
  paymentProofNotificationMail
};