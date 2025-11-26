
const User = require('../../models/User');
const { matchedData } = require('express-validator');
const { encrypt,compare} = require('../../utils/handlePassword')
const { transporter, mailDetails } = require('../../mailer/nodemailer');
const { tokenSign } = require('../../utils/handleJwt');

// const register = async (req, res) => {
//     try {
        
//         // const {name,lastName,identity,email,password,phone,adress}= req.body;
//         const requestData = matchedData(req);
//         const existingUser = await User.findOne({ email: requestData.email });

//             if (existingUser) {
//                 // Si el correo ya existe, envía una respuesta indicando que no es posible registrar el correo
//                 return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
//             }
//             const password = await encrypt(requestData.password);
//             console.log(password)
//             const body = { ...requestData, password };
//         const newUser = await User(body)

       

//         // Guardar el nuevo usuario en la base de datos
//         await newUser.save();
//         const welcomeEmail = mailDetails(newUser.email, newUser.name); // Reemplaza 'NúmeroRadicadoGenerado' con la lógica necesaria
//         await transporter.sendMail(welcomeEmail);

//         // Devolver una respuesta exitosa
//         res.status(201).send(newUser)
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Error al registrar el usuario' });
//     }
// };
// const login = async(req,res)=>{
//     try {
//         req=matchedData(req)
//         const user = await User.findOne({email:req.email})
//         if(!user){
//             res.status(401).send("Usuario no existe")
//             return
//         }
       
//         const hashPassword = user.password;
//        console.log("soy la prueba ",hashPassword)
//         console.log(req.password)
//         const check = await compare(req.password,hashPassword)
//         console.log("soy la contraseña ", check)
//         if(!check){
//             res.status(401).send("Password Invalid")
//             return
//         }
//         user.set('password', undefined, { strict: false });
       
//         const data ={
//             token:await tokenSign(user),
//             user
//         }
//         res.send(data)
//     } catch (error) {
//         console.log(error)
//         res.status(500).send({ message: error.message })
//     }
// }
const register = async (req, res) => {
    try {
        const data = matchedData(req);

        // verificar email existente
        const existingUser = await User.findOne({ email: data.email });
        if (existingUser) {
            return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
        }

        // encriptar
        const hashedPassword = await encrypt(data.password);

        // estructura del body que se guardará
        const userData = { 
            ...data, 
            password: hashedPassword 
        };

        // si es seller pero NO envía storeName → error
        if (userData.rol === "seller" && !userData.storeName) {
            return res.status(400).json({ error: "Los sellers deben enviar storeName" });
        }

        const newUser = new User(userData);
        await newUser.save();

        // enviar email
        const welcomeEmail = mailDetails(newUser.email, newUser.name);
        await transporter.sendMail(welcomeEmail);

        res.status(201).json(newUser);
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


