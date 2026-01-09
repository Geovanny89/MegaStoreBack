const Descuento = require("../../models/Descuento");
const Productos = require("../../models/Productos");
const Suscripcion = require("../../models/Suscripcion");


const productoUser = async (req, res) => {
  try {
    const hoy = new Date();

    const suscripcionesVigentes = await Suscripcion.find({
      estado: { $in: ["activa", "trial"] },
      fecha_vencimiento: { $gte: hoy }
    }).select("id_usuario");

    const idsVendedoresActivos = suscripcionesVigentes.map(s => s.id_usuario);

    const productos = await Productos.find({
      vendedor: { $in: idsVendedoresActivos }
    })
      .populate("tipo", "name")
      .populate("vendedor", "storeName image")
      .lean(); // 👈 MUY IMPORTANTE

    if (!productos.length) return res.json([]);

    /* ================= DESCUENTOS ================= */

    const descuentos = await Descuento.find({
      active: true,
      startDate: { $lte: hoy },
      endDate: { $gte: hoy }
    }).lean();

    const discountMap = new Map();

    descuentos.forEach(d => {
      d.productos.forEach(productId => {
        discountMap.set(productId.toString(), d);
      });
    });

    const productosFinales = productos.map(product => {
      const descuento = discountMap.get(product._id.toString());

      if (!descuento) {
        return {
          ...product,
          finalPrice: product.price, 
          hasDiscount: false
        };
      }

      const price = Number(product.price);

let finalPrice =
  descuento.type === "percentage"
    ? price * (1 - descuento.value / 100)
    : price - descuento.value;

return {
  ...product,
  hasDiscount: true,
  finalPrice: Math.max(Math.round(finalPrice), 0),
  discount: {
    name: descuento.name,
    type: descuento.type,
    value: descuento.value
  }
};
    });

    res.json(productosFinales);

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

const productId = async (req, res) => {
  try {
    const hoy = new Date();
    const { id } = req.params;

    const product = await Productos.findById(id)
      .populate("tipo", "name")
      .populate("vendedor", "storeName")
      .lean();

    if (!product) {
      return res.status(404).send("No existe producto con ese ID");
    }

    const descuento = await Descuento.findOne({
      active: true,
      productos: id,
      startDate: { $lte: hoy },
      endDate: { $gte: hoy }
    }).lean();

    if (!descuento) {
      return res.json({
        ...product,
        finalPrice: product.price,
        hasDiscount: false
      });
    }

    let finalPrice =
      descuento.type === "percentage"
        ? product.price * (1 - descuento.value / 100)
        : product.price - descuento.value;

    res.json({
      ...product,
      finalPrice: Math.max(Math.round(finalPrice), 0),
      hasDiscount: true,
      discount: {
        name: descuento.name,
        type: descuento.type,
        value: descuento.value
      }
    });

  } catch (error) {
    console.error("Error en productId:", error);
    res.status(500).json({ message: error.message });
  }
};



module.exports ={
    productoUser,
    productxName,
    productId
}
