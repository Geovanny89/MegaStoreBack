const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  products: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Productos", required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true }, // precio congelado
      seller: { type: mongoose.Schema.Types.ObjectId, ref: "User" } // si quieres marketplace
    }
  ],

  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  shippingAddress: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  },

  total: { type: Number, required: true },

  status: {
    type: String,
    enum: ["pending", "paid", "processing", "shipped", "delivered", "cancelled"],
    default: "pending"
  },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Order", orderSchema);
