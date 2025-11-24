const Productos = require("../../models/Productos")

const productoUser = async(req,res)=>{
    try {
        const allProducts = await Productos.find().populate('tipo');
        if(!allProducts){
            res.status(404).send("NO existen productos para mostrar")
            return
        }
        res.status(200).send(allProducts)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message })
    }
}
const productxName = async(req,res)=>{
    try {
        const {name}= req.params
        const product = await Productos.find({ name: { $regex: new RegExp(name, 'i') }});
        
        if(!product){
            res.status(400).send("No existe producto con ese nombre") 
            return
        }
        res.status(200).send(product)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message })
    }
}
const productId = async (req, res) => {
    try {
        const { id } = req.params;
        console.log("ID recibido:", id); // Verificar el ID recibido

        if (!id) {
            res.status(404).send("No existe producto con ese ID");
            return;
        }

        // Cambia a findOne
        const product = await Productos.findOne({ _id: id });
        console.log("Producto encontrado:", product); // Verificar el producto encontrado

        if (!product) {
            res.status(404).send("No existe producto con ese ID");
            return;
        }

        res.status(200).send(product);
    } catch (error) {
        console.error("Error al buscar el producto:", error); // Mejor manejo del error
        res.status(500).json({ message: error.message });
    }
};

module.exports ={
    productoUser,
    productxName,
    productId
}
