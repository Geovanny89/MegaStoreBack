const { mongoose, Schema } = require('mongoose');

const productosSchema = mongoose.Schema({
    name: {
        type: String,
        required: true // Corrección aquí
    },
    brand: {
        type: String,
       
    },
    price: {
        type: String,
        required: true // Corrección aquí
    },
    sise: [{
        type: String // Este campo permite múltiples tallas
    }],
    color: [{
        type: String // Este campo permite múltiples colores
    }],
    stock: {
        type: Number,
        required: true // Corrección aquí
    },
    description: {
        type: String
    },
    image: [{
        type: String // Cambiado a String para almacenar URLs
    }],
    tipo: { 
        type: Schema.Types.ObjectId, 
        ref: 'TipoProductos',
        required: true 
    },
    tipo: { type: Schema.Types.ObjectId, ref: "TipoProductos" }

});

module.exports = mongoose.model('Productos', productosSchema);
