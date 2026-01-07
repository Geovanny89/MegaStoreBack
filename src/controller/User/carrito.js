const Campaign = require('../../models/Campaign');
const Carrito = require('../../models/Carrito');
const Producto = require('../../models/Productos');
const User = require('../../models/User');

// ========================
// VER PRODUCTOS EN CARRITO
// ========================
const verProductosEnCarrito = async (req, res) => {
  try {
    const userId = req.user._id;
    const hoy = new Date();

    const carrito = await Carrito.findOne({ user: userId }).populate({
      path: 'items.product',
      populate: {
        path: 'vendedor',
        select: 'paymentMethods storeName slug'
      }
    });

    if (!carrito) {
      return res.status(200).json({ items: [] });
    }

    const itemsLimpios = carrito.items.filter(i => i.product !== null);

    /* ================= DESCUENTOS ================= */
    const descuentos = await Campaign.find({
      active: true,
      startDate: { $lte: hoy },
      endDate: { $gte: hoy }
    }).lean();

    const discountMap = new Map();

    descuentos.forEach(d => {
      d.productos.forEach(pid => {
        discountMap.set(pid.toString(), d);
      });
    });

    const itemsFinales = itemsLimpios.map(item => {
      const product = item.product;
      const descuento = discountMap.get(product._id.toString());

      if (!descuento) {
        return {
          ...item.toObject(),
          finalPrice: product.price,
          hasDiscount: false
        };
      }

      let finalPrice =
        descuento.type === "percentage"
          ? product.price * (1 - descuento.value / 100)
          : product.price - descuento.value;

      return {
        ...item.toObject(),
        finalPrice: Math.max(finalPrice, 0),
        hasDiscount: true,
        discount: {
          name: descuento.name,
          type: descuento.type,
          value: descuento.value
        }
      };
    });

    res.json({ items: itemsFinales });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving carrito." });
  }
};



// ========================
// AGREGAR PRODUCTO AL CARRITO
// ========================

// Controlador para agregar un producto al carrito
const agregarProductoAlCarrito = async (req, res) => {
  try {
    let { productId, quantity } = req.body;

    console.log(req.body);

    // convertir a número
    quantity = Number(quantity);

    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ error: "Datos inválidos" });
    }

    const product = await Producto.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    const userId = req.user._id;

    let carrito = await Carrito.findOne({ user: userId });

    if (!carrito) {
      carrito = new Carrito({ user: userId, items: [] });
    }

    const existingItem = carrito.items.find(
      (item) => item.product.toString() === productId.toString()
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      carrito.items.push({
        product: productId,
        quantity,
      });
    }

    await carrito.save();

    return res
      .status(201)
      .json({ message: "Producto agregado al carrito exitosamente" });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error interno del servidor" });
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
const verCarritoPorTienda = async (req, res) => {
  try {
    const userId = req.user._id;
    const hoy = new Date();

    const carrito = await Carrito.findOne({ user: userId }).populate({
      path: 'items.product',
      populate: {
        path: 'vendedor',
        select: 'paymentMethods storeName slug'
      }
    });

    if (!carrito) {
      return res.status(200).json({ items: [] });
    }

    const itemsLimpios = carrito.items.filter(i => i.product !== null);

    /* ================= DESCUENTOS ================= */
    const descuentos = await Campaign.find({
      active: true,
      startDate: { $lte: hoy },
      endDate: { $gte: hoy }
    }).lean();

    const discountMap = new Map();

    descuentos.forEach(d => {
      d.productos.forEach(pid => {
        discountMap.set(pid.toString(), d);
      });
    });

    const itemsFinales = itemsLimpios.map(item => {
      const product = item.product;
      const descuento = discountMap.get(product._id.toString());

      if (!descuento) {
        return {
          ...item.toObject(),
          finalPrice: product.price,
          hasDiscount: false
        };
      }

      let finalPrice =
        descuento.type === "percentage"
          ? product.price * (1 - descuento.value / 100)
          : product.price - descuento.value;

      return {
        ...item.toObject(),
        finalPrice: Math.max(finalPrice, 0),
        hasDiscount: true,
        discount: {
          name: descuento.name,
          type: descuento.type,
          value: descuento.value
        }
      };
    });

    res.json({ items: itemsFinales });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error retrieving carrito." });
  }
};

module.exports = {
  agregarProductoAlCarrito,
  deleteProductoCarrito,
  verProductosEnCarrito,
  verCarritoPorTienda
  
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