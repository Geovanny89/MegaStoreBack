const mongoose = require("mongoose");
const addressSchema = require("./Address");
const slugify = require("slugify");

const userSchema = new mongoose.Schema({

  /* ================= DATOS BÁSICOS ================= */
  name: { type: String, required: true },
  lastName: String,
  identity: String,
  email: String,
  password: String,
  phone: String,

  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },

  addresses: [addressSchema],

  rol: {
    type: String,
    enum: ["user", "seller", "admin"],
    required: true
  },

  /* ================= TIENDA ================= */
  storeName: {
    type: String,
    default: null
  },
  storeCategory: {
  type: String,
  enum: [
    "Tecnología", 
    "Moda", 
    "Ferretería", 
    "Supermercado", 
    "Hogar", 
    "Belleza", 
    "Deportes",
    "Otros"
  ],
  default: null,
  index: true // Indexar para búsquedas rápidas
},

  slug: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },

  image: {
    type: String,
    default: null
  },

  /* ================= ESTADO SELLER ================= */
  sellerStatus: {
    type: String,
    enum: [
      "pending_payment",
      "pending_review",
      "active",
      "rejected",
      "expired"
    ],
    default: function () {
      return this.rol === "seller" ? "pending_payment" : "active";
    },
    index: true
  },

  paymentProof: {
    type: String,
    default: null
  },

  paymentDate: {
    type: Date,
    default: null
  },

  /* ================= MÉTODOS DE PAGO ================= */
  paymentMethods: {
    nequi: {
      phone: String,
      qr: String
    },
    daviplata: {
      phone: String,
      qr: String
    }
  },

  /* ================= RATING ================= */
  sellerRating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  }

}, { timestamps: true });

/* ===================== GENERAR SLUG AUTOMÁTICO ===================== */
userSchema.pre("save", async function (next) {
  if (this.rol === "seller" && this.storeName && !this.slug) {
    let baseSlug = slugify(this.storeName, {
      lower: true,
      strict: true
    });

    let slug = baseSlug;
    let count = 1;

    while (await mongoose.models.User.findOne({ slug })) {
      slug = `${baseSlug}-${count++}`;
    }
    if (this.rol !== "seller") {
    this.slug = undefined; 
  }

    this.slug = slug;
  }

  next();
});

module.exports = mongoose.model("User", userSchema);
