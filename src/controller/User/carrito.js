const Carrito = require('../../models/Carrito');
const Producto = require('../../models/Productos');

// ========================
// VER PRODUCTOS EN CARRITO
// ========================

const verProductosEnCarrito = async (req, res) => {
  const userId= req.user.id;
 try {
    const car = await Carrito.find({user :userId}).populate('items.product')
    res.json(car)
 } catch (error) {
  console.error(error);
    res.status(500).json({ message: 'Error retrieving banners.' });
 }
}

// ========================
// AGREGAR PRODUCTO AL CARRITO
// ========================

// Controlador para agregar un producto al carrito
const agregarProductoAlCarrito = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    console.log(req.body)

    if (!productId || !quantity) {
      return res.status(400).json({ error: 'Debes proporcionar el ID del producto y la cantidad' });
    }

    // Verificar si el producto existe
    const product = await Producto.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Obtener el ID del usuario desde el objeto 'user' añadido por el middleware
    const userId = req.user._id;

    // Buscar el carrito del usuario (puedes ajustar esto según tu lógica de usuario)
    let carrito = await Carrito.findOne({ user: userId });

    // Si el carrito no existe, crear uno nuevo
    if (!carrito) {
      carrito = new Carrito({ user: userId, items: [] });
    }

    // Verificar si el producto ya está en el carrito
    const existingItem = carrito.items.find(item => item.product.toString() === productId.toString());


    if (existingItem) {
      // Si el producto ya está en el carrito, actualizar la cantidad
      existingItem.quantity += quantity;
    } else {
      // Si el producto no está en el carrito, agregarlo
      carrito.items.push({
        product: productId,
        quantity: quantity,
      });
    }

    // Guardar el carrito actualizado
    await carrito.save();

    res.status(201).json({ message: 'Producto agregado al carrito exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};


// ========================
// ELIMINAR PRODUCTO DEL CARRITO
// ========================
const deleteProductoCarrito =async (req,res) =>{
  try {
    const userId = req.user.id;
    console.log(userId)
    const productId = req.params.id; // El ID del producto que deseas eliminar del carrito
    console.log("el prodcto es :", productId);
    // Buscar el carrito del usuario
    const carrito = await Carrito.findOne({ user: userId });

    // Verificar si el carrito existe
    if (!carrito) {
      return res.status(404).json({ message: 'El usuario no tiene productos en el carrito' });
    }

    // Verificar si el producto está en el carrito
    const index = carrito.items.findIndex(item => item.product.toString() === productId);
    console.log(index);

    if (index === -1) {
      return res.status(404).json({ message: 'El producto no está en el carrito' });
    }

    // Eliminar el producto del array de items en el carrito
    carrito.items.splice(index, 1);

    // Guardar el carrito actualizado
    await carrito.save();

    res.status(200).json({ message: 'Producto eliminado del carrito exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = {
  agregarProductoAlCarrito,
  deleteProductoCarrito,
  verProductosEnCarrito
  
};

// const verProductCarrito = async (req,res)=>{
//   const userId = req.user._id;
//     console.log("holas os",userId)
//   try {
//     // Obtener el ID del usuario autenticado desde el objeto 'user' añadido por el middleware
    
//     // Buscar el carrito del usuario
//     const carrito = await Carrito.findOne({ user: userId });

//     if (!carrito) {
//       res.status(404).send("No hay productos en el carrito del usuario");
//       return;
//     }

//     // Obtener los productos asociados al carrito del usuario
//     const productIds = carrito.items.map(item => item.product);
//     const products = await Producto.find({ _id: { $in: productIds } });

//     if (!products || products.length === 0) {
//       res.status(404).send("No hay productos asociados al carrito del usuario");
//       return;
//     }

//     res.status(200).send(products);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Error interno del servidor' });
//   }
// }