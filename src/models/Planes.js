const mongoose = require("mongoose");

const planSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    unique: true,
    enum: ["basico", "avanzado"]
  },

  // precio mensual dependiendo del tipo de plan
  precio: {
    type: Number,
    required: true
  },

  // cuántos productos puede publicar el usuario según el plan
  productos_permitidos: {
    type: Number,
    required: true
  },

  duracion_meses: {
    type: Number,
    default: 1 // plan mensual
  },

  estado: {
    type: String,
    enum: ["activo", "inactivo"],
    default: "activo"
  }

}, { timestamps: true });

module.exports = mongoose.model("Planes", planSchema);
