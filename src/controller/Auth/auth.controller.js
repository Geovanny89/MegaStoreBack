const User = require('../../models/User');
const Suscripciones = require('../../models/Suscripcion');
const Planes = require('../../models/Planes');
const { matchedData } = require('express-validator');
const { encrypt, compare } = require('../../utils/handlePassword');
const { tokenSign } = require('../../utils/handleJwt');
const { transporter, mailDetails } = require('../../mailer/nodemailer');
const crypto = require("crypto");
const cloudinary = require("../../utils/cloudinary");
const slugify = require('slugify');

const register = async (req, res) => {
  try {
    const data = matchedData(req);

    // 1. Verificar si el correo ya existe
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
    }

    const hashedPassword = await encrypt(data.password);

    let plan = null;
    let storeLogoUrl = null;
    let generatedSlug; // Se queda como undefined inicialmente

    // 2. Lógica específica para Vendedores (Sellers)
    if (data.rol === "seller") {
      if (!data.storeName) {
        return res.status(400).json({ error: "Los sellers deben enviar storeName" });
      }

      // --- GENERACIÓN DEL SLUG ---
      generatedSlug = slugify(data.storeName, { lower: true, strict: true });
      
      const existingSlug = await User.findOne({ slug: generatedSlug });
      if (existingSlug) {
        generatedSlug = `${generatedSlug}-${crypto.randomBytes(2).toString('hex')}`;
      }
      // ---------------------------

      if (!data.planId) {
        return res.status(400).json({ error: "Debes seleccionar un plan para registrarte como seller" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "El logo de la tienda es obligatorio" });
      }

      plan = await Planes.findOne({ _id: data.planId, estado: "activo" });
      if (!plan) {
        return res.status(404).json({ error: "El plan seleccionado no existe o está inactivo" });
      }

      // Subida de imagen a Cloudinary
      storeLogoUrl = await new Promise((resolve, reject) => {
        const upload = cloudinary.uploader.upload_stream(
          { folder: "store_logos" },
          (err, result) => {
            if (err) reject(err);
            else resolve(result.secure_url);
          }
        );
        upload.end(req.file.buffer);
      });
    }

    // 3. Crear el objeto del usuario dinámicamente
    const userData = {
      ...data,
      password: hashedPassword,
      image: storeLogoUrl,
      sellerStatus: data.rol === "seller" ? "pending_payment" : "active"
    };

    // SOLO agregamos el campo slug si existe (esto evita el error E11000 en clientes)
    if (generatedSlug) {
      userData.slug = generatedSlug;
    }

    const newUser = new User(userData);
    await newUser.save();

    // 4. Lógica de suscripción para Sellers
    if (data.rol === "seller" && plan) {
      const fechaInicio = new Date();
      const fechaVencimiento = new Date();
      fechaVencimiento.setMonth(fechaVencimiento.getMonth() + plan.duracion_meses);

      await Suscripciones.create({
        id_usuario: newUser._id,
        plan_id: plan._id,
        fecha_inicio: fechaInicio,
        fecha_vencimiento: fechaVencimiento,
        estado: "pendiente"
      });
    }

    // 5. Envío de correo de bienvenida
    const welcomeEmail = mailDetails(newUser.email, newUser.name);
    await transporter.sendMail(welcomeEmail);

    // 6. Respuesta al cliente
    res.status(201).json({
      message: data.rol === "seller"
        ? "Registro exitoso. Debes enviar el comprobante de pago para activar tu tienda."
        : "Usuario registrado correctamente",
      usuario: newUser,
      storeUrl: generatedSlug ? `/tienda/${generatedSlug}` : null,
      nextStep: data.rol === "seller" ? "upload-payment-proof" : null
    });

  } catch (error) {
    console.error("ERROR EN REGISTER:", error);
    res.status(500).json({ message: "Error al registrar el usuario" });
  }
};
const login = async (req, res) => {
  try {
    const requestData = matchedData(req);
    const user = await User.findOne({ email: requestData.email });

    if (!user) {
      res.status(401).send("Usuario no existe");
      return;
    }

    const hashPassword = user.password;


    const check = await compare(requestData.password, hashPassword);
    console.log("Resultado de la comparación de contraseñas:", check);

    if (!check) {
      res.status(401).send("Contraseña inválida");
      return;
    }

    user.set('password', undefined, { strict: false });

    const data = {
      token: await tokenSign(user),
      user
    };

    res.send(data);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error.message });
  }
};
const updateContraseña = async (req, res) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const valid = await compare(currentPassword, user.password);
    if (!valid) {
      return res.status(401).json({ message: "La contraseña actual es incorrecta" });
    }

    user.password = await encrypt(newPassword);
    await user.save();

    res.json({ message: "Contraseña actualizada correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error cambiando la contraseña" });
  }
};
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log("Email recibido:", email);

    const user = await User.findOne({ email });
    console.log("Usuario encontrado:", user);

    if (!user)
      return res.status(404).json({ message: "El correo no está registrado" });

    const token = crypto.randomBytes(32).toString("hex");
    const expiration = Date.now() + 1000 * 60 * 10; // 10 min

    // CAMPOS CORRECTOS SEGÚN TU SCHEMA
    user.resetPasswordToken = token;
    user.resetPasswordExpires = expiration;

    await user.save();

    const resetLink = `http://localhost:5173/reset-password/${token}`;

    await transporter.sendMail({
      from: "no-reply@tuapp.com",
      to: email,
      subject: "Recuperar contraseña",
      html: `
        <h2>Recuperar contraseña</h2>
        <p>Haz clic en el enlace para restablecer tu contraseña:</p>
        <a href="${resetLink}" target="_blank">Restablecer contraseña</a>
        <p>El enlace expira en 10 minutos.</p>
      `,
    });

    res.json({ message: "Correo enviado con instrucciones" });
  } catch (error) {
    console.log("ERROR:", error);
    res.status(500).json({ message: "Error enviando correo" });
  }
};


// ---------------------------------------------
// RESTABLECER CONTRASEÑA
// ---------------------------------------------
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ message: "Token inválido o expirado" });

    user.password = await encrypt(password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Contraseña actualizada correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al restablecer contraseña" });
  }
};

module.exports = {
  register,
  login,
  updateContraseña,
  forgotPassword,
  resetPassword
};


