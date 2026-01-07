const Favorite = require("../../models/Favorite");
const Producto = require("../../models/Productos");

// ➤ AGREGAR FAVORITO
const AgregarFavorito = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const product = await Producto.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    const existe = await Favorite.findOne({
      user: userId,
      product: productId
    });

    if (existe) {
      return res.status(200).json({ message: "Ya estaba en favoritos" });
    }

    await Favorite.create({ user: userId, product: productId });

    res.status(201).json({ message: "Producto agregado a favoritos" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error agregando favorito" });
  }
};



// ➤ QUITAR FAVORITO
const EliminarFavorito = async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = req.params.productId;

    // Buscar favorito por usuario + producto
    const favorite = await Favorite.findOne({ user: userId, product: productId });

    console.log("FAVORITO ENCONTRADO:", favorite);

    if (!favorite) {
      return res.status(404).json({ message: "El producto no está en favoritos" });
    }

    await Favorite.findByIdAndDelete(favorite._id);

    res.json({ message: "Producto eliminado de favoritos" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error eliminando favorito" });
  }
};


// ➤ LISTAR FAVORITOS
const verFavoritos = async (req, res) => {
  try {
    const allFavorites = await Favorite.find()
      .populate('product')
      .populate('user');

    if (allFavorites.length === 0) {
      return res.status(404).send("No existen favoritos para mostrar");
    }

    return res.status(200).json({
      message: "Favoritos encontrados",
      favorites: allFavorites,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error listando favoritos" });
  }
};


// ➤ VERIFICAR FAVORITO (opcional)
const VerificarFavorito = async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = req.params.productId;

    const fav = await Favorite.findOne({ user: userId, product: productId });

    res.json({
      productId,
      favorite: !!fav
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error verificando favorito" });
  }
};

module.exports = {
  AgregarFavorito,
  EliminarFavorito,
  verFavoritos,
  VerificarFavorito
};
