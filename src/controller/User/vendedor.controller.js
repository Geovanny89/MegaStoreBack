const Productos = require("../../models/Productos");
const Suscripcion = require("../../models/Suscripcion");
const User = require("../../models/User");

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

    // 1. Buscamos al vendedor
    const vendor = await User.findById(req.params.id)
      .select("storeName image");

    if (!vendor) {
      return res.status(404).json({ message: "Vendedor no encontrado" });
    }

    // 🔥 2. VALIDACIÓN DE SUSCRIPCIÓN/TRIAL
    // Buscamos si existe una suscripción vigente para este ID de usuario
    const suscripcionVigente = await Suscripciones.findOne({
      id_usuario: req.params.id,
      estado: { $in: ["activa", "trial"] }, // Debe ser activa o estar en trial
      fecha_vencimiento: { $gte: hoy }      // La fecha de vencimiento debe ser mayor o igual a HOY
    });

    // 3. LÓGICA DE ENTREGA
    // Si NO hay suscripción vigente, devolvemos los productos VACÍOS
    if (!suscripcionVigente) {
      return res.json({ 
        vendedor: vendor, 
        productos: [], 
        statusTienda: "vencida" // Enviamos esta bandera opcional para avisar al frontend
      });
    }

    // 4. Si la suscripción es válida, buscamos los productos normalmente
    const productos = await Productos.find({ vendedor: req.params.id })
      .select("name price image stock tipo brand description rating") // Añadí campos que usa tu frontend
      .populate("tipo", "name"); // Para que funcione tu filtro de categorías

    res.json({ vendedor: vendor, productos });

  } catch (error) {
    console.error("Error en vendedorById:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};



module.exports = { 
    vendedor,
    vendedorById
 };
