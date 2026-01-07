const mongoose = require("mongoose");
const { Schema } = mongoose;

const descuentoSchema = new Schema({
  name: {
    type: String,
    required: true // Ej: "Semana Black"
  },

  type: {
    type: String,
    enum: ["percentage", "fixed"],
    required: true
  },

  value: {
    type: Number,
    required: true // 15 (%) o 20000 ($)
  },

  productos: [
    {
      type: Schema.Types.ObjectId,
      ref: "Productos"
    }
  ],

  vendedor: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  startDate: {
    type: Date,
    required: true
  },

  endDate: {
    type: Date,
    required: true
  },

  active: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

module.exports = mongoose.model("Descuento", descuentoSchema);
