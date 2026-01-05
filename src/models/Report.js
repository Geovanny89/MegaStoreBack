const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null
    },

    reason: {
      type: String,
      required: true,
      enum: [
        "producto_no_entregado",
        "producto_falso",
        "cobro_fraude",
        "comunicacion_falsa",
        "otro"
      ]
    },

    description: {
      type: String,
      default: null
    },

    status: {
      type: String,
      enum: ["pending", "reviewed", "dismissed"],
      default: "pending"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);
