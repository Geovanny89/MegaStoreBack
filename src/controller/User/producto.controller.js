const Productos = require("../../models/Productos")
const Suscripciones = require("../../models/Suscripcion"); // Importante importar el modelo

const productoUser = async (req, res) => {
    try {
        const hoy = new Date();

        // 1. Buscamos todas las suscripciones que estén vigentes (activa o trial)
        const suscripcionesVigentes = await Suscripciones.find({
            estado: { $in: ["activa", "trial"] },
            fecha_vencimiento: { $gte: hoy }
        }).select("id_usuario");

        // 2. Extraemos solo los IDs de los vendedores con suscripción válida
        const idsVendedoresActivos = suscripcionesVigentes.map(s => s.id_usuario);

        // 3. Buscamos los productos, pero filtramos por los vendedores activos
        const allProducts = await Productos.find({
            vendedor: { $in: idsVendedoresActivos } // Solo trae productos de estos vendedores
        })
        .populate("tipo", "name")
        .populate("vendedor", "storeName image");

        if (!allProducts || allProducts.length === 0) {
            return res.status(200).json([]); // Es mejor devolver [] que un 404 para que el front no explote
        }

        res.status(200).json(allProducts);
    } catch (error) {
        console.error("Error en productoUser:", error);
        res.status(500).json({ message: error.message });
    }
};

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
// const productId = async (req, res) => {
//     try {
//         const { id } = req.params;
//         console.log("ID recibido:", id); // Verificar el ID recibido

//         if (!id) {
//             res.status(404).send("No existe producto con ese ID");
//             return;
//         }

//         // Cambia a findOne
//         const product = await Productos.findOne({ _id: id });
//         console.log("Producto encontrado:", product); // Verificar el producto encontrado

//         if (!product) {
//             res.status(404).send("No existe producto con ese ID");
//             return;
//         }

//         res.status(200).send(product);
//     } catch (error) {
//         console.error("Error al buscar el producto:", error); // Mejor manejo del error
//         res.status(500).json({ message: error.message });
//     }
// };
const productId = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Productos.findById(id)
      .populate("tipo", "name")
      .populate("vendedor", "storeName");

      console.log("este es el vendedor " , product);
    if (!product) {
      return res.status(404).send("No existe producto con ese ID");
    }

    res.status(200).send(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

module.exports ={
    productoUser,
    productxName,
    productId
}
