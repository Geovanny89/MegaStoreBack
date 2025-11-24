const nodemailer = require('nodemailer');        
const path = require('path');                       //Libreria 'nodemailer'
require('dotenv').config();
const { NODEMAILER } = process.env;                                     //Variables de entorno, NODEMAILER es la contraseña generada en Google


module.exports = {
    transporter: nodemailer.createTransport({
        service: 'gmail',                                               //Se escribe el servicio de correo
        auth: {
            user: 'pruebadesarrollo2184@gmail.com',                            //Correo de la empresa
            pass: NODEMAILER,                                           //Contraseña del correo
        },
    }),


    mailDetails: (email, name) => {                                           //^Mail de bienvenida para el cliente
        const currentDate = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const logoPath = path.join(__dirname, '..', '..','..','client', 'src', 'Assets', 'logo-1.jpeg');


        return {
            from: 'pruebadesarrollo2184@gmail.com',                            //Correo de la empresa
            to: email,                                                  //Email del usuario
            subject: `¡Bienvenido a JMG STORE!`,                  //Asunto del corre
            html: `
            <div style="max-width: 600px; margin: 0 auto; text-align: center; font-family: 'Arial', sans-serif; background-color: #f7f7f7; padding: 20px;">
            <img src="cid:logo" alt="JMG STORE Logo" style="max-width: 100px; margin-bottom: 20px;">
            <p style="font-size: 14px; color: #555;">${currentDate}</p>
            <h1 style="color: #007BFF; margin-bottom: 10px;">¡Bienvenido a JMG STORE!</h1>
            <p style="font-size: 16px; color: #333;">¡Hola ${name}!</p>
            <p style="font-size: 16px; color: #333;">Estamos emocionados de darte la bienvenida a nuestra tienda virtual. En JMG STORE, no solo encuentras accesorios para celulares, sino que también descubrirás un mundo de innovación y estilo para complementar tu dispositivo.</p>
            <p style="font-size: 16px; color: #333;">En nuestra tienda, nos esforzamos por ofrecerte lo último en accesorios de alta calidad, desde fundas elegantes hasta auriculares de última generación y cargadores innovadores. Tu satisfacción es nuestra prioridad, y estamos aquí para asegurarnos de que encuentres exactamente lo que necesitas.</p>
            <p style="font-size: 16px; color: #333;">Explora nuestras secciones y descubre la diversidad de productos que tenemos para ti. Si tienes alguna pregunta o necesitas ayuda, nuestro equipo de atención al cliente está listo para asistirte.</p>
            <p style="font-size: 16px; color: #333;">Gracias por unirte a la familia JMG STORE. ¡Esperamos que tu experiencia de compra sea extraordinaria!</p>
            <p style="font-size: 16px; color: #333;">Atentamente, El equipo de JMG STORE</p>
        </div>
                
            `,
            attachments: [
                {
                    filename: 'logo-1.jpeg',
                    path: logoPath,
                    cid: 'logo', // Este ID será utilizado en el src del elemento img
                },
            ],
        }

    },
}