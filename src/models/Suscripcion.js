const mongoose = require('mongoose');

const suscripcionSchema = new mongoose.Schema({
  id_usuario: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
   
  },
  plan_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Planes', 
    required: true 
  },
  estado: { 
    type: String, 
    enum: ['activa', 'vencida', 'cancelada'], 
    default: 'activa' 
  },
  fecha_inicio: { 
    type: Date, 
    default: Date.now 
  },
  fecha_vencimiento: { 
    type: Date,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Suscripciones', suscripcionSchema);
