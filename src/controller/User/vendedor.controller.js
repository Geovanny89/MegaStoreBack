const Productos = require("../../models/Productos");
const User = require("../../models/User");

const vendedor = async (req, res) => {
  try {
    // Filtrar solo usuarios con rol "seller"
    const vendedorAll = await User.find({ rol: "seller" })
      .select("storeName storeLogo email phone rol");

    if (!vendedorAll || vendedorAll.length === 0) {
      return res.status(404).json({ message: "No existen vendedores" });
    }

    res.status(200).json(vendedorAll);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};


const vendedorById = async (req, res) => {
 try {
    const vendor = await User.findById(req.params.id)
      .select("storeName storeLogo email phone ");

    if (!vendor) {
      return res.status(404).json({ message: "Vendedor no encontrado" });
    }

    const productos = await Productos.find({ vendedor: req.params.id })
      .select("name price image stock");

    res.json({ vendedor: vendor, productos });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};




module.exports = { 
    vendedor,
    vendedorById
 };
