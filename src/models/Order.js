const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({

  // =========================
  // PRODUCTOS
  // =========================
  products: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Productos",
        required: true
      },
      productName: {
        type: String,
        required: true
      },
      quantity: {
        type: Number,
        required: true
      },
      price: {
        type: Number,
        required: true
      },
      seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      reviewed: {
        type: Boolean,
        default: false
      }
    }
  ],

  // =========================
  // COMPRADOR
  // =========================
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  // =========================
  // ENTREGA
  // =========================
  deliveryMethod: {
    type: String,
    enum: ["delivery", "pickup"],
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

  // =========================
  // DISPOSITIVO
  // =========================
  device: {
    type: String,
    enum: ["mobile", "desktop"],
    required: true
  },

  // =========================
  // PAGO
  // =========================
  paymentMethod: {
    type: String,
    enum: ["nequi", "daviplata", "cash_on_delivery"],
    required: true
  },

  // preparado para pasarela futura
  paymentType: {
    type: String,
    enum: ["manual", "gateway"],
    default: "manual"
  },

  // estado del pago (solo informativo)
  paymentStatus: {
    type: String,
    enum: ["pending", "uploaded", "confirmed", "rejected"],
    default: "pending"
  },

  // snapshot del método de pago del vendedor
  paymentInfo: {
    method: {
      type: String,
      enum: ["nequi", "daviplata"]
    },
    phone: String,
    qr: String
  },

  // comprobante subido por el comprador
  paymentProof: {
    fileUrl: String,
    fileType: String,
    uploadedAt: Date,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },

  // referencia escrita por el comprador
  paymentReference: String,

  // motivo de rechazo
  paymentRejectionReason: String,

  // =========================
  // ESTADO DE LA ORDEN
  // =========================
  total: {
    type: Number,
    required: true
  },

  status: {
    type: String,
    enum: [
      "pending_payment",   // creada, esperando comprobante
      "payment_uploaded",  // comprobante subido
      "processing",        // pago confirmado
      "shipped",           // enviado
      "delivered",         // recibido
      "cancelled"
    ],
    default: "pending_payment"
  },

  // =========================
  // AUDITORÍA
  // =========================
  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("Order", orderSchema);
