const mongoose = require("mongoose");
const addressSchema = require("./Address");
const slugify = require("slugify");

// 1. Mantenemos tus categorías exactamente igual
const STORE_CATEGORIES = [
  "Tecnología y Electrónica",
  "Moda y Accesorios",
  "Hogar y Muebles",
  "Salud y Belleza",
  "Deportes y Fitness",
  "Supermercado y Alimentos",
  "Restaurantes y Gastronomía",
  "Juguetes y Bebés",
  "Mascotas",
  "Ferretería y Construcción",
  "Automotriz",
  "Papelería y Oficina",
  "Arte y Artesanías",
  "Servicios Profesionales",
  "Otros"
];

const userSchema = new mongoose.Schema(
  {
    /* ================= DATOS BÁSICOS ================= */
    name: { type: String, required: true },
    lastName: { type: String, default: null },
    identity: { type: String, default: null },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: { type: String, required: true },
    phone: { type: String, default: null },

    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },

    addresses: [addressSchema],

    rol: {
      type: String,
      enum: ["user", "seller", "admin"],
      required: true
    },

    /* ================= TIENDA ================= */
    storeName: { type: String, default: null },

    storeCategory: {
      type: String,
      enum: STORE_CATEGORIES, 
      default: null,
      index: true
    },

    slug: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true
    },

    image: { type: String, default: null },

    /* ================= VERIFICACIÓN DE IDENTIDAD ================= */
    verification: {
      isVerified: { type: Boolean, default: false },

      idDocumentFront: {
        url: { type: String, default: null },
        public_id: { type: String, default: null }
      },

      selfieWithPaper: {
        url: { type: String, default: null },
        public_id: { type: String, default: null }
      },

      verifiedAt: { type: Date, default: null },
      verificationReason: { type: String, default: null },

      registrationIp: { type: String, default: null },
      registrationDevice: { type: String, default: null },

      trustScore: { type: Number, default: 50 }
    },

    /* ================= ESTADO SELLER (ÚNICO) ================= */
    sellerStatus: {
      type: String,
      enum: [
        "pending_identity",
        "rejected_identity",
        "pending_payment",
        "pending_review",
        "active",
        "rejected",
        "suspended",
        "expired"
      ],
      default: function () {
        return this.rol === "seller" ? "pending_identity" : "active";
      },
      index: true
    },

    /* ================= PAGO ================= */
    paymentProof: { type: String, default: null },
    paymentDate: { type: Date, default: null },

    /* ================= MÉTODOS DE PAGO ================= */
paymentMethods: {
  type: [
    {
      type: {
        type: String,
        enum: ["phone", "email", "document", "random", "cod"],
        required: true
      },

      // 🔹 No obligatorio si es COD
      value: {
        type: String,
        required: function () {
          return this.type !== "cod";
        }
      },

      provider: {
        type: String,
        enum: ["nequi", "daviplata", "bancolombia", "bbva", "llaves", "otro", "cod"],
        required: true
      },

      // 🔹 SOLO PARA CONTRAENTREGA
      cities: {
        type: [String],
        default: [],
      },

      note: {
        type: String,
        default: ""
      },

      qr: { type: String, default: null },
      active: { type: Boolean, default: true }
    }
  ],

  // ✅ VALIDACIÓN SUAVE (NO OBLIGATORIA)
  validate: {
    validator: function (methods) {
      // No validar si no es seller
      if (this.rol !== "seller") return true;

      // Puede no tener métodos aún
      if (!Array.isArray(methods)) return true;

      // Si hay COD, debe tener ciudades
      const cod = methods.find(m => m.type === "cod");
      if (cod && cod.cities.length === 0) return false;

      return true;
    },
    message: "La contraentrega debe tener al menos una ciudad configurada."
  }
},

    /* ================= PLAN DE SUSCRIPCIÓN ================= */
    subscriptionPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Planes",
      default: null,
      index: true
    },

    /* ================= RATING Y REPORTES ================= */
    sellerRating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 }
    },

    reportsCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

/* ================= MIDDLEWARE PRE-SAVE ================= */
userSchema.pre("save", async function (next) {
  // 1. Limpieza de datos si el rol no es seller
  if (this.rol !== "seller") {
    this.storeName = null;
    this.storeCategory = null;
    this.slug = undefined;
    return next();
  }

  // 2. Validación obligatoria para vendedores
  if (this.rol === "seller") {
    if (!this.storeName) return next(new Error("El nombre de la tienda es obligatorio para vendedores."));
    if (!this.storeCategory) return next(new Error("La categoría de la tienda es obligatoria."));
  }

  // 3. Generación de Slug automático para la Tienda (SEO)
  if (this.storeName && (this.isModified("storeName") || !this.slug)) {
    const baseSlug = slugify(this.storeName, {
      lower: true,
      strict: true
    });

    let slug = baseSlug;
    let count = 1;

    // Verificar unicidad del slug para que no choquen tiendas con nombres iguales
    while (await mongoose.models.User.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${count++}`;
    }
    this.slug = slug;
  }

  next();
});

module.exports = mongoose.model("User", userSchema);