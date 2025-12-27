const Productos = require('../../models/Productos')
const TipoProductos = require('../../models/TipoProductos');
const cloudinary = require('../../utils/cloudinary');
const Suscripciones = require('../../models/Suscripcion');

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
    const { name, price, brand, tipoId, color, stock, description, sise } = req.body;

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
      vendedor: sellerId
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
    console.log("hola soy el id", id)

    if (!id) {
      res.status(404).send("No existe producto con ese ID")
      return
    }
    const existingProduct = await Productos.findById(id);
    if (!existingProduct) {
      res.status(404).send("No existe producto con ese ID.");
      return;
    }
    const { name, price, image, stock, brand, description } = req.body
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
    const update = await Productos.findByIdAndUpdate(id, updateFields, { new: true });
    res.status(200).send(update)

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
    const product = await Productos.findById(req.params.id)
      .populate("tipo", "name")
      .populate("vendedor", "storeName");

    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
}
module.exports = {
  allProduct,
  productName,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductId
}