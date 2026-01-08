const User = require("../../models/User");
const Product = require("../../models/Productos");

const getStoreBySlug = async (req, res) => {
  try {

    const { slug } = req.params;

    // 1. Buscamos al vendedor por su slug
    const seller = await User.findOne({ slug, rol: "seller" }).select("-password");

    if (!seller) {
      return res.status(404).json({ message: "Tienda no encontrada" });
    }

    // 2. Buscamos los productos que pertenecen a ese vendedor
    // Asegúrate de que en tu modelo de Producto el campo sea 'seller'
    const productos = await Product.find({ seller: seller._id }).populate("tipo");

    res.json({
      seller,
      productos
    });
  } catch (error) {
    res.status(500).json({ message: "Error en el servidor", error });
  }
};

module.exports = { getStoreBySlug };