const User = require('../../models/User');
const Suscripciones = require('../../models/Suscripcion');
const Planes = require('../../models/Planes');
const { matchedData } = require('express-validator');
const { encrypt,compare} = require('../../utils/handlePassword');
const { tokenSign } = require('../../utils/handleJwt');
const { transporter, mailDetails } = require('../../mailer/nodemailer');

const register = async (req, res) => {
    try {
        const data = matchedData(req);

        // verificar email único
        const existingUser = await User.findOne({ email: data.email });
        if (existingUser) {
            return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
        }

        const hashedPassword = await encrypt(data.password);

        // 👉 Si quiere ser seller, validar campos obligatorios
        let plan = null;

        if (data.rol === "seller") {

    if (!data.storeName) {
        return res.status(400).json({ error: "Los sellers deben enviar storeName" });
    }

    if (!data.planId) {
        return res.status(400).json({ error: "Debes seleccionar un plan para registrarte como seller" });
    }

    // validar plan por ID
    plan = await Planes.findOne({ _id: data.planId, estado: "activo" });

    if (!plan) {
        return res.status(404).json({ error: "El plan seleccionado no existe o está inactivo" });
    }
}

        // crear usuario
        const newUser = new User({
            ...data,
            password: hashedPassword
        });

        await newUser.save();

        // 👉 Si es seller, crear suscripción automáticamente
        if (data.rol === "seller") {
            const fechaInicio = new Date();
            const fechaVencimiento = new Date();
            fechaVencimiento.setMonth(fechaVencimiento.getMonth() + plan.duracion_meses);

            await Suscripciones.create({
                id_usuario: newUser._id,
                plan_id: plan._id,
                fecha_inicio: fechaInicio,
                fecha_vencimiento: fechaVencimiento,
                estado: "activa"
            });
        }

        // enviar email
        const welcomeEmail = mailDetails(newUser.email, newUser.name);
        await transporter.sendMail(welcomeEmail);

        res.status(201).json({
            message: "Usuario registrado correctamente",
            usuario: newUser,
            suscripcion: data.rol === "seller" ? "creada" : "no aplica"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al registrar el usuario' });
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
        console.log("Contraseña almacenada en la base de datos:", hashPassword);
        console.log("Contraseña proporcionada en la solicitud:", requestData.password);

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

module.exports = {
    register,
    login
};


