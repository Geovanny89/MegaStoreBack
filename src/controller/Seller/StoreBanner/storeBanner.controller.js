const StoreBanner = require("../../../models/StoreBanner");
const Suscripcion = require("../../../models/Suscripcion");
const cloudinary = require("../../../utils/cloudinary");


const crearBanner = async (req, res) => {
  try {
    const sellerId = req.user.id;
    console.log("Soy el seller",sellerId)
    // 1. Validar Rol
    if (req.user.rol !== "seller") {
      return res.status(403).json({ message: "Solo los vendedores pueden subir banners" });
    }

    // 2. Validar Suscripción (Trial o Activa)
    // Buscamos en la tabla de suscripciones que nos mostraste antes
    const suscripcion = await Suscripcion.findOne({ id_usuario: sellerId });
    
    const estadosPermitidos = ["trial", "activa"];
    
    if (!suscripcion || !estadosPermitidos.includes(suscripcion.estado)) {
      return res.status(403).json({ 
        message: "Para subir banners debes estar en periodo de prueba (trial) o tener una suscripción activa." 
      });
    }

    // 3. Procesar Imagen
    if (!req.file?.buffer) {
      return res.status(400).json({ message: "La imagen es obligatoria" });
    }

    const { title, description, linkType, linkValue, startDate, endDate } = req.body;

    const image = await new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        { folder: "banners_tienda", resource_type: "image" },
        (err, result) => {
          if (err) return reject(err);
          resolve({ url: result.secure_url, public_id: result.public_id });
        }
      );
      upload.end(req.file.buffer);
    });

    // 4. Guardar
    const banner = new StoreBanner({
      seller: sellerId,
      image,
      title,
      description,
      linkType,
      linkValue,
      startDate: startDate || null,
      endDate: endDate || null
    });

    await banner.save();

    res.status(201).json({
      message: "Banner creado correctamente",
      banner
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};


const listarMisBanners = async (req, res) => {
  try {
    const sellerId = req.user.id;

    const banners = await StoreBanner.find({ seller: sellerId })
      .sort({ createdAt: -1 });

    res.json(banners);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/*ACTIVAR O DESACTIVAR BANNER */
const toggleBanner = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { id } = req.params;

    const banner = await StoreBanner.findOne({
      _id: id,
      seller: sellerId
    });

    if (!banner) {
      return res.status(404).json({ message: "Banner no encontrado" });
    }

    banner.isActive = !banner.isActive;
    await banner.save();

    res.json({
      message: "Estado actualizado",
      isActive: banner.isActive
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const eliminarBanner = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { id } = req.params;

    const banner = await StoreBanner.findOneAndDelete({
      _id: id,
      seller: sellerId
    });

    if (!banner) {
      return res.status(404).json({ message: "Banner no encontrado" });
    }

    // 🧨 BORRAR DE CLOUDINARY
    await cloudinary.uploader.destroy(banner.image.public_id);

    res.json({ message: "Banner eliminado correctamente" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* LLAMAR EN STOREFRONT */
const obtenerBannersPublicos = async (sellerId) => {
  const now = new Date();

  return StoreBanner.find({
    seller: sellerId,
    isActive: true,
    $or: [
      { startDate: null, endDate: null },
      {
        startDate: { $lte: now },
        endDate: { $gte: now }
      }
    ]
  }).sort({ createdAt: -1 });
};


module.exports={
    crearBanner,
    listarMisBanners,
    toggleBanner,
    eliminarBanner,
    obtenerBannersPublicos
}