const mongoose = require('mongoose')
const dotenv = require('dotenv').config();
mongoose
    .connect(process.env.MONGO_URL)
    .then(() => {
        console.log('Conectado a la Base de Datos')
    })
    .catch(error => console.log('Error, no se pudo hacer la conexión a la base de datos'))

    
module.exports = { connection: mongoose }