
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

const createTipeProduct = async(req,res )=>{
    try {
        const {name} = req.body;
        const existingTipe = await TipoProductos.findOne({ name });

        if (existingTipe) {
            res.status(400).send("El tipo ya existe");
            return;
        }
        if(!name){
            res.status(404).send("Por favor diligencia el formulario")
            return
        }
        
        const newTipe = await TipoProductos(req.body);
        await newTipe.save()
        res.status(200).send(newTipe)

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message })
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
