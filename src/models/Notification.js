const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    default: null
  },
  seller: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    default: null
  },

  type: { 
    type: String, 
    enum: ["order", "question", "message"], 
    required: true 
  },

  message: String,

  status: {
    type: String,
    enum: ["pending", "paid", "processing", "shipped", "delivered", "cancelled"],
    required: function () {
      return this.type === "order";
    }
  },

  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Notification", notificationSchema);