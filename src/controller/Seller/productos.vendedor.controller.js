const Productos = require("../../models/Productos");
const TipoProductos = require("../../models/TipoProductos");
const Suscripciones = require("../../models/Suscripcion");
const cloudinary = require("../../utils/cloudinary");

/**
 * Obtener productos del vendedor autenticado
 */
const getMyProducts = async (req, res) => {
  try {
    const sellerId = req.user.id;

    const productos = await Productos.find({ vendedor: sellerId }).populate("tipo");

    res.json(productos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Crear producto (con validación de suscripción y Cloudinary)
 */
const createSellerProduct = async (req, res) => {
  try {
    const { name, price, brand, tipoId, color, stock, description, sise } = req.body;
    const sellerId = req.user.id;

    // Validar duplicado por vendedor
    const existing = await Productos.findOne({ name, vendedor: sellerId });
    if (existing) return res.status(400).json({ message: "Ya tienes un producto con este nombre." });

    // Validar tipo
    const tipo = await TipoProductos.findById(tipoId);
    if (!tipo) return res.status(400).json({ message: "El tipo de producto no existe" });

    // Validar suscripción
    const suscripcion = await Suscripciones.findOne({
      id_usuario: sellerId,
      estado: "activa"
    }).populate("plan_id");

    if (!suscripcion) {
      return res.status(403).json({ message: "Necesitas una suscripción activa" });
    }

    const limite =
      suscripcion.plan_id.nombre === "emprendedor"
        ? 20
        : suscripcion.plan_id.nombre === "premium"
          ? 80
          : null;

    const cantidad = await Productos.countDocuments({ vendedor: sellerId });

    if (limite !== null && cantidad >= limite) {
      return res.status(403).json({ message: `Tu plan solo permite ${limite} productos` });
    }

    // Manejo de tallas
    const sizesArray = sise ? sise.split(",").map((s) => s.trim()) : [];
    if (tipo.usaTalla && sizesArray.length === 0) {
      return res.status(400).json({ message: "Este producto requiere tallas" });
    }
    if (!tipo.usaTalla) sizesArray.length = 0;

    // Manejo de colores
    const colorsArray = color ? color.split(",").map((c) => c.trim()) : [];

    // Subir imágenes a Cloudinary
    const imageUrls = await Promise.all(
      req.files.map(file => {
        if (!file.buffer) {
          throw new Error("Archivo de imagen inválido");
        }

        return new Promise((resolve, reject) => {
          const upload = cloudinary.uploader.upload_stream(
            {
              folder: "productos_tienda",
              resource_type: "image"
            },
            (err, result) => {
              if (err) return reject(err);
              resolve({
                url: result.secure_url,
                public_id: result.public_id
              });
            }
          );
          upload.end(file.buffer);
        });
      })
    );


    const nuevoProducto = new Productos({
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

    await nuevoProducto.save();
    res.json(nuevoProducto);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Actualizar producto del vendedor
 */


const updateSellerProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user.id;

    const product = await Productos.findOne({
      _id: id,
      vendedor: sellerId
    });

    if (!product) {
      return res
        .status(404)
        .json({ message: "Producto no encontrado o no es tuyo" });
    }

    /* ================= IMÁGENES ================= */

    // 1️⃣ Imágenes que el seller decidió mantener
    let imagesArray = [];

    if (req.body.existingImages) {
      try {
        imagesArray = JSON.parse(req.body.existingImages);
      } catch {
        return res
          .status(400)
          .json({ message: "Formato inválido de existingImages" });
      }
    }

    // Validar formato correcto
    const validImages = imagesArray.every(
      img => img.url && img.public_id
    );

    if (!validImages && imagesArray.length > 0) {
      return res.status(400).json({
        message: "existingImages debe contener { url, public_id }"
      });
    }

    const newImagesCount = req.files ? req.files.length : 0;
    const totalImages = imagesArray.length + newImagesCount;

    if (totalImages > 5) {
      return res.status(400).json({
        message: "Máximo 5 imágenes por producto"
      });
    }

    // 2️⃣ 🔥 BORRAR IMÁGENES ELIMINADAS
    const imagesToDelete = product.image.filter(
      oldImg =>
        !imagesArray.some(
          img => img.public_id === oldImg.public_id
        )
    );

    await Promise.all(
      imagesToDelete.map(img =>
        cloudinary.uploader.destroy(img.public_id)
      )
    );

    // 3️⃣ SUBIR NUEVAS IMÁGENES
    if (req.files && req.files.length > 0) {
      const uploadedImages = await Promise.all(
        req.files.map(
          file =>
            new Promise((resolve, reject) => {
              const stream = cloudinary.uploader.upload_stream(
                { folder: "productos_tienda" },
                (error, result) => {
                  if (error) return reject(error);
                  resolve({
                    url: result.secure_url,
                    public_id: result.public_id
                  });
                }
              );
              stream.end(file.buffer);
            })
        )
      );

      imagesArray.push(...uploadedImages);
    }

    /* ================= CAMPOS ================= */

    product.name = req.body.name ?? product.name;
    product.price = req.body.price ?? product.price;
    product.brand = req.body.brand ?? product.brand;
    product.tipo = req.body.tipoId ?? product.tipo;
    product.stock = req.body.stock ?? product.stock;
    product.description = req.body.description ?? product.description;

    product.color = req.body.color
      ? req.body.color.split(",").map(c => c.trim())
      : product.color;

    product.sise = req.body.sise
      ? req.body.sise.split(",").map(s => s.trim())
      : product.sise;

    // 4️⃣ Guardar solo las imágenes finales
    product.image = imagesArray;

    await product.save();

    res.json({
      message: "Producto actualizado correctamente",
      product
    });

  } catch (error) {
    console.error("Error actualizando producto:", error);
    res.status(500).json({ message: error.message });
  }
};






/**
 * Eliminar producto del vendedor
 */
// const deleteSellerProduct = async (req, res) => {
//   try {
//     const sellerId = req.user.id;
//     const { id } = req.params;

//     const product = await Productos.findOne({ _id: id, vendedor: sellerId });
//     if (!product)
//       return res.status(404).json({ message: "Producto no encontrado o no es tuyo" });

//     await Productos.findByIdAndDelete(id);
//     res.json({ message: "Producto eliminado" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
const deleteSellerProduct = async (req, res) => {
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

module.exports = {
  getMyProducts,
  createSellerProduct,
  updateSellerProduct,
  deleteSellerProduct,
};
