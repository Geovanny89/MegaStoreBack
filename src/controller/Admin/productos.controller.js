const Productos = require('../../models/Productos')
const TipoProductos = require('../../models/TipoProductos');
const cloudinary = require('../../utils/cloudinary');
const Suscripciones = require('../../models/Suscripcion');
const Descuento = require("../../models/Descuento");

/**
 * Obtener todos los productos.
 *
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @returns {Promise<void>} Promesa que resuelve con la respuesta al cliente.
 */

const allProduct = async (req, res) => {
  try {
    const product = await Productos.find().populate('tipo');
    

    if (product.length === 0) {
      res.status(404).json({ message: "No existen productos" });
      return
    }

    res.status(200).send(product)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}

/**
 * Obtener un producto por nombre.
 *
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @returns {Promise<void>} Promesa que resuelve con la respuesta al cliente.
 */
const productName = async (req, res) => {
  try {
    const { name } = req.params
    const product = await Productos.findOne({ name: { $regex: new RegExp(name, 'i') } });

    if (!product) {
      res.status(400).send("No existe producto con ese nombre")
      return
    }
    res.status(200).send(product)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}

/**
 * Crear un nuevo producto.
 *
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @returns {Promise<void>} Promesa que resuelve con la respuesta al cliente.
 */

const createProduct = async (req, res) => {
  try {
    const { name, price, brand, tipoId, color, stock, description, sise,shippingPolicy,shippingNote } = req.body;

    // Validar producto duplicado
    const existingProduct = await Productos.findOne({ name });
    if (existingProduct) {
      return res.status(400).json({ message: "El producto ya existe" });
    }
    // ------------------------------
    // VALIDAR SUSCRIPCIÓN DEL SELLER
    // ------------------------------
    const sellerId = req.user.id; // Asegúrate de que req.user llegue con el JWT

    const suscripcionActiva = await Suscripciones.findOne({
      id_usuario: sellerId,
      estado: "activa"
    }).populate("plan_id");

    if (!suscripcionActiva) {
      return res.status(403).json({
        message: "Debes tener una suscripción activa para crear productos."
      });
    }

    const plan = suscripcionActiva.plan_id;

    let limiteProductos = null;
    if (plan.nombre === "basico") limiteProductos = 15;
    if (plan.nombre === "avanzado") limiteProductos = 50;

    const productosActuales = await Productos.countDocuments({ vendedor: sellerId });

    if (limiteProductos !== null && productosActuales >= limiteProductos) {
      return res.status(403).json({
        message: `Tu plan (${plan.nombre}) solo permite ${limiteProductos} productos`
      });
    }

    // FIN VALIDACIÓN DE SUSCRIPCIÓN
    // ------------------------------

    // Validar tipo de producto
    const tipo = await TipoProductos.findById(tipoId);
    if (!tipo) {
      return res.status(400).json({ message: "El tipo de producto no existe" });
    }

    // Convertir tallas en array limpio
    const sizesArray = sise
      ? Array.isArray(sise)
        ? sise
        : sise.split(",").map((s) => s.trim())
      : [];

    // ⚠ Validación importante: si el tipo requiere talla, debe enviarla
    if (tipo.usaTalla && sizesArray.length === 0) {
      return res.status(400).json({
        message: "Este tipo de producto requiere tallas (ej: S,M,L o 21-27)."
      });
    }

    // Validación adicional: si NO usa talla, limpiamos para evitar datos basura
    if (!tipo.usaTalla) {
      sizesArray.length = 0; // Vaciar tallas
    }

    // Convertir colores
    const colorsArray = color
      ? Array.isArray(color)
        ? color
        : color.split(",").map((c) => c.trim())
      : [];

    // Subida de imágenes a Cloudinary
  const imageUrls = await Promise.all(
  req.files.map(file =>
    new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        { folder: "Carpeta_tienda" },
        (err, result) => {
          if (err) return reject(err);
          resolve({
            url: result.secure_url,
            public_id: result.public_id
          });
        }
      );
      upload.end(file.buffer);
    })
  )
);

 /* ================= VALIDAR SHIPPING ================= */
const allowedPolicies = ["free", "coordinar"];
    const normalizedPolicy = shippingPolicy?.toLowerCase();

    const finalShippingPolicy = allowedPolicies.includes(normalizedPolicy)
      ? normalizedPolicy
      : "coordinar";

    const finalShippingNote =
      finalShippingPolicy === "coordinar" ? shippingNote || "" : "";
    // Crear producto
    const product = new Productos({
      name,
      price,
      brand,
      stock,
      description,
      sise: sizesArray,
      color: colorsArray,
      image: imageUrls,
      tipo: tipoId,
      vendedor: sellerId,
      shippingPolicy: finalShippingPolicy,
      shippingNote: shippingNote || ""
    });

    await product.save();

    res.status(200).json(product);

  } catch (error) {
    console.error("Error creando producto:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Actulizar un  producto.
 *
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @returns {Promise<void>} Promesa que resuelve con la respuesta al cliente.
 */

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params
    
   

    if (!id) {
      res.status(404).send("No existe producto con ese ID")
      return
    }
    const existingProduct = await Productos.findById(id);
    if (!existingProduct) {
      res.status(404).send("No existe producto con ese ID.");
      return;
    }
    const { name, price, image, stock, brand, description,shippingPolicy,shippingNote } = req.body
    const updateFields = {};
    if (name) {
      updateFields.name = name;
    }
    if (price) {
      updateFields.price = price;
    }
    if (brand) {
      updateFields.brand = brand;
    }
    if (image) {
      updateFields.image = image;
    }
    if (stock) {
      updateFields.stock = stock;
    }
    if (description) {
      updateFields.description = description;
    }
    /* ================= LÓGICA DE ENVÍO ================= */
    
    // Si viene la política de envío, la validamos y normalizamos
    if (shippingPolicy) {
      const normalizedPolicy = shippingPolicy.toLowerCase();
      if (["free", "coordinar"].includes(normalizedPolicy)) {
        updateFields.shippingPolicy = normalizedPolicy;
      }
    }

    // Manejo de la nota de envío
    // Si la política es 'free', la nota debe estar vacía obligatoriamente
    const currentPolicy = updateFields.shippingPolicy || existingProduct.shippingPolicy;
    
    if (currentPolicy === "free") {
      updateFields.shippingNote = ""; 
    } else if (shippingNote !== undefined) {
      // Si es 'coordinar', aceptamos la nota que venga en el body
      updateFields.shippingNote = shippingNote;
    }

    /* =================================================== */

    const updated = await Productos.findByIdAndUpdate(
      id,
      { $set: updateFields }, // Usamos $set para ser explícitos
      { new: true, runValidators: true } // runValidators asegura que respete el enum del modelo
    );
 res.status(200).json(updated);
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: error.message })
  }
}

/**
 * Eliminar un  producto.
 *
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @returns {Promise<void>} Promesa que resuelve con la respuesta al cliente.
 */

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Productos.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    // 🔥 ELIMINAR IMÁGENES DE CLOUDINARY
    if (product.image && product.image.length > 0) {
      await Promise.all(
        product.image.map(img =>
          cloudinary.uploader.destroy(img.public_id)
        )
      );
    }

    // 🗑 Eliminar producto de la DB
    await Productos.findByIdAndDelete(id);

    res.json({ message: "Producto e imágenes eliminados correctamente" });

  } catch (error) {
    console.error("Error eliminando producto:", error);
    res.status(500).json({ message: error.message });
  }
};



const getProductId = async (req, res) => {
  try {
    const hoy = new Date();
    const { id } = req.params;

    const product = await Productos.findById(id)
      .populate("tipo", "name")
      .populate("vendedor", "storeName")
      .lean();

    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }
const shippingInfo = {
      isFree: product.shippingPolicy === "free",
      label: product.shippingPolicy === "free" ? "Envío Gratis" : "Envío a coordinar",
      note: product.shippingNote || ""
    };
    const price = Number(product.price);

    const descuento = await Descuento.findOne({
      vendedor: product.vendedor._id,
      active: true,
      productos: id,
      startDate: { $lte: hoy },
      endDate: { $gte: hoy }
    }).lean(); 

    if (!descuento) {
      return res.json({
        ...product,
        finalPrice: price,
        hasDiscount: false
      });
    }

    let finalPrice =
      descuento.type === "percentage"
        ? price * (1 - descuento.value / 100)
        : price - descuento.value;
 
    res.json({
      ...product,
      finalPrice: Math.max(Math.round(finalPrice), 0),
      hasDiscount: true,
      discount: {
        name: descuento.name,
        type: descuento.type,
        value: descuento.value,
        startDate: descuento.startDate,  // <-- agregamos la fecha de inicio
        endDate: descuento.endDate,
        shipping: shippingInfo,
      }
    });

  } catch (error) {
    console.error("Error en getProductId:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

module.exports = {
  allProduct,
  productName,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductId
}