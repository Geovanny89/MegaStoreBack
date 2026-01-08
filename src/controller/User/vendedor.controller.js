const Productos = require("../../models/Productos");
const Suscripcion = require("../../models/Suscripcion");
const User = require("../../models/User");
const Descuento = require('../../models/Descuento')

const vendedor = async (req, res) => {
  try {
    const { categoria } = req.query;
    const hoy = new Date();

    // 1. Buscamos los usuarios que son sellers y están en estados permitidos
    let query = {
      rol: "seller",
      sellerStatus: { $in: ["active", "pending_payment"] }
    };

    if (categoria && categoria !== "Todas") {
      query.storeCategory = categoria;
    }

    // 2. Traemos los vendedores
    const vendedores = await User.find(query)
      .select("storeName storeLogo email phone rol image storeCategory subscriptionPlan")
      .populate("subscriptionPlan", "nombre price");

    // 🔥 3. FILTRO DINÁMICO POR FECHA
    // Buscamos todas las suscripciones activas/trial para estos usuarios
    const idsUsuarios = vendedores.map(v => v._id);
    const suscripcionesActivas = await Suscripcion.find({
      id_usuario: { $in: idsUsuarios },
      estado: { $in: ["activa", "trial"] },
      fecha_vencimiento: { $gte: hoy } // Que el vencimiento sea MAYOR o IGUAL a hoy
    });

    // 4. Cruzamos la información
    // Solo dejamos los vendedores que tienen una suscripción vigente en la tabla Suscripciones
    const vendedoresVigentes = vendedores.filter(v => {
      return suscripcionesActivas.some(s => s.id_usuario.toString() === v._id.toString());
    });

    if (vendedoresVigentes.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(vendedoresVigentes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Asegúrate de tener importado el modelo de Suscripciones al inicio de tu archivo


const vendedorById = async (req, res) => {
  try {
    const hoy = new Date();

    // 1. Buscar vendedor
    const vendor = await User.findById(req.params.id)
      .select("storeName image slug");

    if (!vendor) {
      return res.status(404).json({ message: "Vendedor no encontrado" });
    }

    // 2. Validar suscripción / trial
    const suscripcionVigente = await Suscripcion.findOne({
      id_usuario: req.params.id,
      estado: { $in: ["activa", "trial"] },
      fecha_vencimiento: { $gte: hoy }
    });

    if (!suscripcionVigente) {
      return res.json({
        vendedor: vendor,
        productos: [],
        statusTienda: "vencida"
      });
    }

    // 3. Productos del vendedor
    const productos = await Productos.find({ vendedor: req.params.id })
      .select("name price image stock tipo brand description rating shippingPolicy shippingNote")
      .populate("tipo", "name");

    // 4. Descuentos activos

    const descuentos = await Descuento.find({

      vendedor: req.params.id,
      active: true,
      startDate: { $lte: hoy },
      endDate: { $gte: hoy }
    });




    // 5. Mapa producto → descuento
    const discountMap = new Map();

    descuentos.forEach(d => {
      d.productos.forEach(prodId => {
        discountMap.set(prodId.toString(), d);

      });
    });

    // 6. Aplicar descuentos
    const productosConDescuento = productos.map(p => {

      const descuento = discountMap.get(p._id.toString());


      const price = Number(p.price);

      if (!descuento) {
        return {
          ...p.toObject(),
          hasDiscount: false,
          finalPrice: price
        };
      }

      let finalPrice =
        descuento.type === "percentage"
          ? price * (1 - descuento.value / 100)
          : price - descuento.value;

      return {
        ...p.toObject(),
        hasDiscount: true,
        finalPrice: Math.max(Math.round(finalPrice), 0),
        discount: {
          name: descuento.name,
          type: descuento.type,
          value: descuento.value
        }
      };
    });

    // 7. Respuesta final
    res.json({
      vendedor: vendor,
      productos: productosConDescuento
    });

  } catch (error) {
    console.error("Error en vendedorById:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};


module.exports = {
  vendedor,
  vendedorById
};
