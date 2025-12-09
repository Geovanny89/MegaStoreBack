const mongoose = require("mongoose");

const favoriteSchema = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Productos", required: true },
  createdAt: { type: Date, default: Date.now }
});

// Índice compuesto -> evita duplicados
favoriteSchema.index({ user: 1, product: 1 }, { unique: true });

module.exports = mongoose.model("Favorite", favoriteSchema);
