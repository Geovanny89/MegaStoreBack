
const TipoProductos = require('../../models/TipoProductos')
const User = require('../../models/User')
/**
 * Obtener todos los tipos de productos.
 *
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @returns {Promise<void>} Promesa que resuelve con la respuesta al cliente.
 */
const allTipesProductos= async(req,res)=>{
    try {
        const allTipes = await TipoProductos.find()
       
        
        if(allTipes.length === 0){
            res.status(404).send("No hay tipos Disponibles")
            return
        }
        res.status(200).send(allTipes)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message })
    }
}

const tiposPorCategoriaTienda = async (req, res) => {
  try {
    // 1️⃣ Buscar la tienda del vendedor
 
    const store = await User.findById(req.user.id);

    if (!store) {
      return res.status(404).json({
        message: "El vendedor no tiene tienda registrada"
      });
    }

    // 2️⃣ Filtrar tipos por la categoría de la tienda
   const tipos = await TipoProductos.find({
  categoriaPadre: req.user.storeCategory
});

    res.status(200).json(tipos);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Obtener tipo por nombre.
 *
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @returns {Promise<void>} Promesa que resuelve con la respuesta al cliente.
 */

const tipeProductName = async(req,res)=>{
    try {
        const {name}= req.params
        const tipe = await TipoProductos.findOne({name: {$regex : new RegExp(name,'i')}})
        if(!tipe){
            res.status(404).send("No exite tipo de producto con ese nombre ")
            return
        }
        res.status(200).send(tipe)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message })
    }
}


/**
 * Crear un nuevo tipo de producto.
 *
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @returns {Promise<void>} Promesa que resuelve con la respuesta al cliente.
 */

/**
 * Crea un tipo de producto con soporte para SEO (Slug y Metadatos)
 */
/**
 * Crea un tipo de producto (Subcategoría) 
 * Genera automáticamente el SEO (slug) a partir del nombre ingresado por el Admin.
 */
const createTipeProduct = async (req, res) => {
  try {
    const { name, categoriaPadre, usaTalla } = req.body;

    if (!name || !categoriaPadre) {
      return res.status(400).json({
        message: "El nombre y la categoría padre son obligatorios."
      });
    }

    // ✅ Duplicado SOLO dentro del mismo padre
    const existingTipe = await TipoProductos.findOne({
      name,
      categoriaPadre
    });

    if (existingTipe) {
      return res.status(400).json({
        message: "Esta subcategoría ya existe en esta categoría."
      });
    }

    const baseSlug = (text) =>
      text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

    const generatedSlug = `${baseSlug(name)}-${baseSlug(categoriaPadre)}`;

    const newTipe = new TipoProductos({
      name,
      categoriaPadre,
      usaTalla: usaTalla || false,
      slug: generatedSlug,
      metaTitle: `${name} | Ofertas en ${categoriaPadre}`,
      description: `Encuentra ${name} de las mejores tiendas de ${categoriaPadre}.`
    });

    await newTipe.save();
    res.status(201).json(newTipe);

  } catch (error) {
    console.error("Error al crear tipo de producto:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Actualizar tipo de producto.
 *
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @returns {Promise<void>} Promesa que resuelve con la respuesta al cliente.
 */

const updateTipeName = async(req,res)=>{
    try {
        const {id}= req.params
        
        
        if(!id){
            res.status(404).send("No existe ningun tipo con ese ID")
            return
        }
        const {name} = req.body
        const update = await TipoProductos.findByIdAndUpdate(id,{
            name
        },{new:true})
        res.status(200).send(update)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message })
    }
}

/**
 * Eliminar tipo de producto.
 *
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @returns {Promise<void>} Promesa que resuelve con la respuesta al cliente.
 */

const deleteTipe = async(req,res)=>{
    try {
        const {id}= req.params
        if(!id){
            res.status(404).send("No existe tipo con ese id")
            return
        }
        const tipeDelete = await TipoProductos.findByIdAndDelete(id)
        res.status(200).send("Producto eliminado Correctamente ")
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message })
    }
}
module.exports ={
    createTipeProduct,
    allTipesProductos,
    tipeProductName,
    updateTipeName,
    deleteTipe,
    tiposPorCategoriaTienda
};
