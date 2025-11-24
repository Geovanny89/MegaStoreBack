const Productos = require('../../models/Productos');
const TipoProductos = require('../../models/TipoProductos');
/**
 * Obtener todos los tipos de productos.
 *
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @returns {Promise<void>} Promesa que resuelve con la respuesta al cliente.
 */


const allTipesProductosUser = async (req, res) => {
    try {
        // Obtener todos los tipos de productos
        const allTypes = await TipoProductos.find();

        // Verificar si no hay tipos disponibles
        if (allTypes.length === 0) {
            return res.status(404).send("No hay tipos disponibles");
        }

        // Mapear la respuesta para incluir los productos asociados a cada tipo
        const response = await Promise.all(allTypes.map(async (tipo) => {
            // Obtener los productos asociados al tipo actual
            const productos = await Productos.find({ tipo: tipo._id });

            // Crear un objeto con la información del tipo y sus productos
            const tipoConProductos = {
                _id: tipo._id,
                name: tipo.name,
                __v: tipo.__v,
                productos: productos.map(producto => ({
                    _id: producto._id,
                    name: producto.name,
                    price: producto.price,
                    stock: producto.stock,
                    description: producto.description,
                    image: producto.image,
                    __v: producto.__v
                }))
            };

            return tipoConProductos;
        }));

        res.status(200).send(response);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};
const tipesId = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar si el ID está presente
        if (!id) {
            res.status(400).send("Falta el parámetro ID");
            return;
        }

        // Obtener el tipo de producto por ID
        const tipo = await TipoProductos.findById(id);

        // Verificar si el tipo de producto existe
        if (!tipo) {
            res.status(404).send("No existe categoría con ese ID");
            return;
        }

        // Obtener los productos asociados al tipo actual
        const productos = await Productos.find({ tipo: tipo._id });

        // Crear un objeto con la información del tipo y sus productos
        const tipoConProductos = {
            _id: tipo._id,
            name: tipo.name,
            __v: tipo.__v,
            productos: productos.map(producto => ({
                _id: producto._id,
                name: producto.name,
                price: producto.price,
                stock: producto.stock,
                description: producto.description,
                image: producto.image,
                __v: producto.__v
            }))
        };

        res.status(200).send(tipoConProductos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    allTipesProductosUser,
    tipesId
};
