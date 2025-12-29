const Productos = require("../../models/Productos");
const User = require("../../models/User");

const vendedor = async (req, res) => {
  try {
    // 1. Capturamos la categoría desde la URL (ej: /vendedor/all?categoria=Moda)
    const { categoria } = req.query;

    // 2. Definimos el filtro base (siempre que sean sellers)
    let query = { rol: "seller" };

    // 3. Si el usuario envió una categoría y no es "Todas", la agregamos al filtro
    if (categoria && categoria !== "Todas") {
      query.storeCategory = categoria;
    }

    // 4. Ejecutamos la búsqueda con el filtro dinámico
    const vendedorAll = await User.find(query)
      .select("storeName storeLogo email phone rol image storeCategory"); // Agregué storeCategory

    if (!vendedorAll || vendedorAll.length === 0) {
      // Devolvemos un array vacío en lugar de 404 para que el frontend 
      // pueda mostrar el mensaje de "No hay tiendas en esta categoría"
      return res.status(200).json([]);
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
      .select("storeName image  ");

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
