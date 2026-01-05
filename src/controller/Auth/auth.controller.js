const User = require('../../models/User');
const Suscripciones = require('../../models/Suscripcion');
const Planes = require('../../models/Planes');
const { matchedData } = require('express-validator');
const { encrypt, compare } = require('../../utils/handlePassword');
const { tokenSign } = require('../../utils/handleJwt');
const { transporter, mailDetails, welcomeSellerMail } = require('../../mailer/nodemailer');
const crypto = require("crypto");
const cloudinary = require("../../utils/cloudinary");
const slugify = require('slugify');


const registerUser = async (req, res) => {
  try {
    const data = matchedData(req);
    
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
    }

    const hashedPassword = await encrypt(data.password);

    const newUser = await User.create({
      ...data,
      password: hashedPassword,
      rol: "user",
      sellerStatus: "active" 
    });

    // 🔥 SOLUCIÓN: Quitamos el 'await' para que el correo se envíe en segundo plano
    // No bloqueamos la respuesta al cliente
    const welcomeEmail = mailDetails(newUser.email, newUser.name);
    
    transporter.sendMail(welcomeEmail).catch(err => {
      console.error("Error enviando correo en segundo plano:", err);
    });

    // El cliente recibe su respuesta de inmediato
    return res.status(201).json({ 
      message: "Usuario registrado correctamente", 
      usuario: newUser 
    });

  } catch (error) {
    console.error("ERROR EN REGISTER_USER:", error);
    res.status(500).json({ message: "Error al registrar el usuario" });
  }
};
/**
 * REGISTRO PARA VENDEDORES (SELLERS)
 */
const registerSeller = async (req, res) => {
  try {
    const data = matchedData(req);
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    /* ================= 1. VALIDACIONES INICIALES ================= */
    if (!data.name || !data.email || !data.password || !data.storeName || !data.planId || !data.storeCategory) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    if (!req.files || !req.files["image"]) {
      return res.status(400).json({ error: "La imagen de la tienda es obligatoria" });
    }

    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      return res.status(400).json({ error: "El correo ya está registrado" });
    }

    /* ================= 2. PROCESOS PESADOS EN PARALELO ================= */
    // Cloudinary y Encriptación corren al tiempo para ahorrar segundos
    const [storeLogoResult, hashedPassword, plan] = await Promise.all([
      uploadToCloudinary(req.files["image"][0], "store_logos"),
      encrypt(data.password),
      Planes.findOne({ _id: data.planId, estado: "activo" })
    ]);

    if (!plan) {
      return res.status(404).json({ error: "Plan inválido o inactivo" });
    }

    /* ================= 3. GENERAR SLUG ÚNICO ================= */
    let generatedSlug = slugify(data.storeName, { lower: true, strict: true });
    let count = 1;
    while (await User.findOne({ slug: generatedSlug })) {
      generatedSlug = `${slugify(data.storeName, { lower: true, strict: true })}-${count++}`;
    }

    /* ================= 4. GUARDAR EN BASE DE DATOS (USUARIO) ================= */
    const newUser = new User({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      phone: data.phone || null,
      rol: "seller",
      sellerStatus: "pending_identity",
      storeName: data.storeName,
      storeCategory: data.storeCategory,
      slug: generatedSlug,
      image: storeLogoResult.secure_url,
      verification: {
        isVerified: false,
        registrationIp: ip,
        registrationDevice: req.headers["user-agent"] || "Unknown Device"
      },
      subscriptionPlan: plan._id
    });

    await newUser.save();

    /* ================= 5. CREAR SUSCRIPCIÓN TRIAL ================= */
    const trialDurationDays = 5;
    const expirationDate = new Date(Date.now() + trialDurationDays * 24 * 60 * 60 * 1000);

    const trial = await Suscripciones.create({
      id_usuario: newUser._id,
      plan_id: plan._id,
      estado: "trial",
      fecha_inicio: new Date(),
      fecha_vencimiento: expirationDate
    });

    console.log("✅ Vendedor y Trial creados correctamente");

    /* ================= 6. ENVÍO DE EMAIL (ASÍNCRONO) ================= */
    // Se dispara aquí porque ya sabemos que el usuario se guardó bien.
    // No usamos 'await' para que el usuario no espere la respuesta del servidor de correo.
    transporter.sendMail(welcomeSellerMail(newUser.email, newUser.name))
      .then(() => console.log(`📧 Email enviado a ${newUser.email}`))
      .catch(err => console.error("❌ Error enviando email:", err));

    /* ================= 7. RESPUESTA FINAL AL CLIENTE ================= */
    return res.status(201).json({
      message: "Registro exitoso. Disfruta de 5 días de prueba. Al finalizar deberás subir el comprobante de pago.",
      usuario: {
        id: newUser._id,
        email: newUser.email,
        slug: newUser.slug,
        sellerStatus: newUser.sellerStatus
      },
      trial: {
        endsAt: expirationDate
      },
      nextStep: "/seller/verify-identity",
      storeUrl: `/${newUser.slug}`
    });

  } catch (error) {
    console.error("❌ ERROR EN REGISTER_SELLER:", error);
    return res.status(500).json({
      message: "Error al registrar el vendedor",
      error: error.message
    });
  }
};


// Helper que ya tenías, se mantiene igual
const uploadToCloudinary = (file, folder) => {
  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      { folder: folder },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
    upload.end(file.buffer);
  });
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
  registerUser,
  registerSeller,
  login,
  updateContraseña,
  forgotPassword,
  resetPassword
};



// const register = async (req, res) => {
//   try {
//     const data = matchedData(req);

//     // 1. Verificar si el correo ya existe
//     const existingUser = await User.findOne({ email: data.email });
//     if (existingUser) {
//       return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
//     }

//     const hashedPassword = await encrypt(data.password);

//     let plan = null;
//     let storeLogoUrl = null;
//     let generatedSlug; // Se queda como undefined inicialmente

//     // 2. Lógica específica para Vendedores (Sellers)
//     if (data.rol === "seller") {
//       if (!data.storeName) {
//         return res.status(400).json({ error: "Los sellers deben enviar storeName" });
//       }

//       // --- GENERACIÓN DEL SLUG ---
//       generatedSlug = slugify(data.storeName, { lower: true, strict: true });
      
//       const existingSlug = await User.findOne({ slug: generatedSlug });
//       if (existingSlug) {
//         generatedSlug = `${generatedSlug}-${crypto.randomBytes(2).toString('hex')}`;
//       }
//       // ---------------------------

//       if (!data.planId) {
//         return res.status(400).json({ error: "Debes seleccionar un plan para registrarte como seller" });
//       }

//       if (!req.file) {
//         return res.status(400).json({ error: "El logo de la tienda es obligatorio" });
//       }

//       plan = await Planes.findOne({ _id: data.planId, estado: "activo" });
//       if (!plan) {
//         return res.status(404).json({ error: "El plan seleccionado no existe o está inactivo" });
//       }

//       // Subida de imagen a Cloudinary
//       storeLogoUrl = await new Promise((resolve, reject) => {
//         const upload = cloudinary.uploader.upload_stream(
//           { folder: "store_logos" },
//           (err, result) => {
//             if (err) reject(err);
//             else resolve(result.secure_url);
//           }
//         );
//         upload.end(req.file.buffer);
//       });
//     }

//     // 3. Crear el objeto del usuario dinámicamente
//     const userData = {
//       ...data,
//       password: hashedPassword,
//       image: storeLogoUrl,
//       sellerStatus: data.rol === "seller" ? "pending_payment" : "active"
//     };

//     // SOLO agregamos el campo slug si existe (esto evita el error E11000 en clientes)
//     if (generatedSlug) {
//       userData.slug = generatedSlug;
//     }

//     const newUser = new User(userData);
//     await newUser.save();

//     // 4. Lógica de suscripción para Sellers
//     if (data.rol === "seller" && plan) {
//       const fechaInicio = new Date();
//       const fechaVencimiento = new Date();
//       fechaVencimiento.setMonth(fechaVencimiento.getMonth() + plan.duracion_meses);

//       await Suscripciones.create({
//         id_usuario: newUser._id,
//         plan_id: plan._id,
//         fecha_inicio: fechaInicio,
//         fecha_vencimiento: fechaVencimiento,
//         estado: "pendiente"
//       });
//     }

//     // 5. Envío de correo de bienvenida
//     const welcomeEmail = mailDetails(newUser.email, newUser.name);
//     await transporter.sendMail(welcomeEmail);

//     // 6. Respuesta al cliente
//     res.status(201).json({
//       message: data.rol === "seller"
//         ? "Registro exitoso. Debes enviar el comprobante de pago para activar tu tienda."
//         : "Usuario registrado correctamente",
//       usuario: newUser,
//       storeUrl: generatedSlug ? `/tienda/${generatedSlug}` : null,
//       nextStep: data.rol === "seller" ? "upload-payment-proof" : null
//     });

//   } catch (error) {
//     console.error("ERROR EN REGISTER:", error);
//     res.status(500).json({ message: "Error al registrar el usuario" });
//   }
// };