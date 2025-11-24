const { mongoose, Schema } = require('mongoose');

const tipoProductosSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },

    // 👇 Este campo define si el tipo usa tallas (ropa, zapatos, brasieres, etc)
    usaTalla: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('TipoProductos', tipoProductosSchema);
