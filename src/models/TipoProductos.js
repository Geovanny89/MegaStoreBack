const mongoose = require('mongoose');

const tipoProductosSchema = mongoose.Schema({
    name: { 
        type: String, 
        required: true, 
        unique: true 
    },
    // 👇 Amigable para Google: "Moda y Accesorios" -> "moda-y-accesorios"
    slug: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true 
    },
    categoriaPadre: { type: String, required: true },
    usaTalla: { type: Boolean, default: false },
    
    // 👇 Campos SEO extra
    description: { type: String }, // Para el meta-description de la página
    metaTitle: { type: String }     // Título específico para la pestaña del navegador
}, { timestamps: true });

module.exports = mongoose.model('TipoProductos', tipoProductosSchema);