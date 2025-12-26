const mongoose = require('mongoose');

const suscripcionSchema = new mongoose.Schema({
  id_usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  plan_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Planes",
    required: true
  },

  estado: {
    type: String,
    enum: ["pendiente", "en_revision", "activa", "vencida", "rechazada"],
    default: "pendiente"
  },

  paymentProof: {
    type: String,
    default: null
  },

  paymentDate: {
    type: Date,
    default: null
  },

  fecha_inicio: Date,
  fecha_vencimiento: Date

}, { timestamps: true });

module.exports = mongoose.model('Suscripciones', suscripcionSchema);
