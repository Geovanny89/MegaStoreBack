const Productos = require("../../models/Productos");
const TipoProductos = require("../../models/TipoProductos");
const Suscripciones = require("../../models/Suscripcion");
const cloudinary = require("../../utils/cloudinary");
const XLSX = require("xlsx");
const AdmZip = require("adm-zip");

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
    const { name, price, brand, tipoId, color, stock, description, sise,shippingPolicy,shippingNote } = req.body;
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
  estado: { $in: ["activa", "trial"] }
}).populate("plan_id");

if (!suscripcion) {
  return res.status(403).json({
    message: "Necesitas una suscripción activa o un período de prueba"
  });
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
/* ================= ENVÍO ================= */
    const allowedPolicies = ["free", "coordinar"];
    const finalShippingPolicy = allowedPolicies.includes(shippingPolicy)
      ? shippingPolicy
      : "coordinar";

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
      vendedor: sellerId,
       shippingPolicy: finalShippingPolicy,
      shippingNote: shippingNote || ""
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
      const allowedPolicies = ["free", "coordinar"];

    if (req.body.shippingPolicy) {
      product.shippingPolicy = allowedPolicies.includes(req.body.shippingPolicy)
        ? req.body.shippingPolicy
        : product.shippingPolicy;
    }

    if (req.body.shippingNote !== undefined) {
      product.shippingNote = req.body.shippingNote;
    }

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


const importProductsFromExcel = async (req, res) => {
  try {
    const sellerId = req.user.id;

    /* ================= VALIDAR ARCHIVOS ================= */
    const excelFile = req.files?.excel?.[0];
    const zipFile = req.files?.images?.[0];

    if (!excelFile || !zipFile) {
      return res.status(400).json({
        message: "Debes subir un archivo Excel y un ZIP con imágenes"
      });
    }

    /* ================= VALIDAR SUSCRIPCIÓN ================= */
    const suscripcion = await Suscripciones.findOne({
      id_usuario: sellerId,
      estado: { $in: ["activa", "trial"] }
    }).populate("plan_id");

    if (!suscripcion) {
      return res.status(403).json({
        message: "Necesitas una suscripción activa o trial"
      });
    }

    const limite =
      suscripcion.plan_id.nombre === "emprendedor"
        ? 20
        : suscripcion.plan_id.nombre === "premium"
        ? 80
        : null;

    const cantidadActual = await Productos.countDocuments({ vendedor: sellerId });

    /* ================= LEER EXCEL ================= */
    const workbook = XLSX.read(excelFile.buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (!rows.length) {
      return res.status(400).json({ message: "El Excel está vacío" });
    }

    if (limite !== null && cantidadActual + rows.length > limite) {
      return res.status(403).json({
        message: `Tu plan permite ${limite} productos. Intentas subir ${rows.length}`
      });
    }

    /* ================= LEER ZIP ================= */
    const zip = new AdmZip(zipFile.buffer);
    const imageMap = {};
    zip.getEntries().forEach(entry => {
      if (!entry.isDirectory) {
        imageMap[entry.entryName] = entry.getData();
      }
    });

    /* ================= OPTIMIZACIÓN 1: CACHÉ DE CATEGORÍAS ================= */
    // En lugar de buscar en la DB por cada producto, traemos todas las categorías una sola vez
    const todasLasCategorias = await TipoProductos.find({});
    const categoriaCache = {};
    todasLasCategorias.forEach(cat => {
      categoriaCache[cat.name.toLowerCase().trim()] = cat;
    });

    /* ================= OPTIMIZACIÓN 2: PROCESAMIENTO EN PARALELO ================= */
    // Definimos una función para procesar un solo producto
    const procesarProducto = async (row) => {
      try {
        const tipoNombre = String(row.tipo || row.tipoId || "").trim().toLowerCase();
        if (!tipoNombre) throw new Error(`Falta la categoría en el producto: ${row.name}`);

        const tipo = categoriaCache[tipoNombre];
        if (!tipo) throw new Error(`Categoría "${tipoNombre}" no existe`);

        // Validar duplicado (esto sigue siendo necesario pero es rápido)
        const existe = await Productos.findOne({ name: row.name, vendedor: sellerId });
        if (existe) return null;

        const sizesArray = row.sise ? row.sise.split(",").map(s => s.trim()).filter(Boolean) : [];
        const colorsArray = row.color ? row.color.split(",").map(c => c.trim()).filter(Boolean) : [];

        if (!row.images) throw new Error(`El producto "${row.name}" no tiene imágenes`);
        const imageNames = row.images.split(",").map(i => i.trim());

        /* OPTIMIZACIÓN 3: SUBIDA DE IMÁGENES EN PARALELO */
        const uploadPromises = imageNames.map(async (imageName) => {
          const buffer = imageMap[imageName];
          if (!buffer) throw new Error(`Imagen no encontrada: ${imageName}`);

          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { 
                folder: "productos_tienda",
                // Optimización de Cloudinary: redimensionar y comprimir al subir
                transformation: [
                  { width: 1000, height: 1000, crop: "limit" },
                  { quality: "auto", fetch_format: "auto" }
                ]
              },
              (err, result) => {
                if (err) return reject(err);
                resolve({ url: result.secure_url, public_id: result.public_id });
              }
            );
            stream.end(buffer);
          });
        });

        const uploadedImages = await Promise.all(uploadPromises);

        return new Productos({
          name: row.name,
          price: row.price,
          brand: row.brand,
          stock: row.stock,
          description: row.description,
          sise: sizesArray,
          color: colorsArray,
          image: uploadedImages,
          tipo: tipo._id,
          vendedor: sellerId
        });
      } catch (error) {
        console.error(`Error procesando producto ${row.name}:`, error.message);
        return { error: error.message, productName: row.name };
      }
    };

    // Ejecutamos el procesamiento de todos los productos en paralelo
    // Usamos un límite de concurrencia si son muchos (ej. 5 a la vez) para no saturar Cloudinary/DB
    const batchSize = 5;
    let productosFinales = [];
    let errores = [];

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const resultados = await Promise.all(batch.map(row => procesarProducto(row)));
      
      resultados.forEach(res => {
        if (res && !res.error) productosFinales.push(res);
        else if (res && res.error) errores.push(res);
      });
    }

    /* ================= OPTIMIZACIÓN 4: INSERCIÓN MASIVA (BULK INSERT) ================= */
    if (productosFinales.length > 0) {
      await Productos.insertMany(productosFinales);
    }

    res.json({
      message: "Importación completada",
      creados: productosFinales.length,
      errores: errores.length > 0 ? errores : undefined
    });

  } catch (error) {
    console.error("Error general de importación:", error);
    res.status(500).json({ message: error.message });
  }
};




module.exports = {
  getMyProducts,
  createSellerProduct,
  updateSellerProduct,
  deleteSellerProduct,
  importProductsFromExcel
};
