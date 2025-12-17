const mongoose = require("mongoose");


const orderSchema = new mongoose.Schema({
  products: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Productos", required: true },
      productName: String,
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
      seller: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      reviewed: {
        type: Boolean,
        default: false
      }
    }
  ],

  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  deliveryMethod: {
    type: String,
    enum: ["delivery", "pickup", "cash_on_delivery"],
    required: true
  },

  shippingAddress: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  },

  pickupStore: {
    storeName: String,
    address: {
      street: String,
      city: String
    }
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