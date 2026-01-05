
const TipoProductos = require('../../models/TipoProductos')
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

        // 1. Validaciones de datos obligatorios
        if (!name || !categoriaPadre) {
            return res.status(400).send("Faltan datos: El nombre y el rubro de la tienda son obligatorios.");
        }

        // 2. Verificar si el nombre ya existe para evitar duplicados
        const existingTipe = await TipoProductos.findOne({ name });
        if (existingTipe) {
            return res.status(400).send("Este tipo de producto ya existe.");
        }

        // 3. GENERACIÓN AUTOMÁTICA DEL SLUG (SEO)
        // Esto convierte "Moda y Accesorios" en "moda-y-accesorios" automáticamente
        const generatedSlug = name
            .toLowerCase()
            .normalize("NFD")               // Separa tildes de las letras
            .replace(/[\u0300-\u036f]/g, "") // Elimina las tildes
            .replace(/[^a-z0-9\s-]/g, "")    // Elimina caracteres especiales (@, #, $, etc)
            .trim()
            .replace(/\s+/g, "-")           // Cambia espacios por guiones
            .replace(/-+/g, "-");           // Evita guiones dobles

        // 4. Crear el registro en la base de datos
        const newTipe = new TipoProductos({
            name,
            categoriaPadre,
            usaTalla: usaTalla || false,
            slug: generatedSlug, // Se guarda automáticamente para el SEO del Marketplace
            metaTitle: `${name} | Las mejores ofertas en nuestro Marketplace`,
            description: `Encuentra una amplia variedad de ${name} de las mejores tiendas de ${categoriaPadre}.`
        });

        await newTipe.save();
        
        // Enviamos la respuesta con el objeto creado
        res.status(201).json(newTipe);

    } catch (error) {
        console.error("Error al crear tipo de producto:", error);
        res.status(500).json({ message: error.message });
    }
}
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
    deleteTipe
};
