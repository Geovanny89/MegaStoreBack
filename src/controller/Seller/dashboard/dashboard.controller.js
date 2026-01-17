// const Order = require("../../../models/Order");

// const getSellerDashboard = async (req, res) => {
//   try {
//     const sellerId = req.user._id;

//     /* ================= FILTRO BASE ================= */
//     const match = {
//       "products.seller": sellerId,
//       status: { $in: ["paid", "processing", "shipped", "delivered"] }
//     };

//     /* ================= HOY ================= */
//     const startToday = new Date();
//     startToday.setHours(0, 0, 0, 0);

//     const today = await Order.aggregate([
//       { $match: match },
//       { $unwind: "$products" },
//       { $match: { "products.seller": sellerId } },
//       { $match: { createdAt: { $gte: startToday } } },
//       {
//         $group: {
//           _id: null,
//           total: { $sum: { $multiply: ["$products.price", "$products.quantity"] } }
//         }
//       }
//     ]);

//     /* ================= SEMANA (Últimos 7 días) ================= */
//     const startWeek = new Date();
//     startWeek.setDate(startWeek.getDate() - 7);

//     const week = await Order.aggregate([
//       { $match: match },
//       { $unwind: "$products" },
//       { $match: { "products.seller": sellerId } },
//       { $match: { createdAt: { $gte: startWeek } } },
//       {
//         $group: {
//           _id: null,
//           total: { $sum: { $multiply: ["$products.price", "$products.quantity"] } }
//         }
//       }
//     ]);

//     /* ================= MES (Desde el día 1) ================= */
//     const startMonth = new Date();
//     startMonth.setDate(1);
//     startMonth.setHours(0, 0, 0, 0);

//     const month = await Order.aggregate([
//       { $match: match },
//       { $unwind: "$products" },
//       { $match: { "products.seller": sellerId } },
//       { $match: { createdAt: { $gte: startMonth } } },
//       {
//         $group: {
//           _id: null,
//           total: { $sum: { $multiply: ["$products.price", "$products.quantity"] } }
//         }
//       }
//     ]);

//     /* ================= VENTAS DIARIAS (Gráfica) ================= */
//     const dailySales = await Order.aggregate([
//       { $match: match },
//       { $unwind: "$products" },
//       { $match: { "products.seller": sellerId } },
//       {
//         $group: {
//           _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
//           total: { $sum: { $multiply: ["$products.price", "$products.quantity"] } }
//         }
//       },
//       { $sort: { _id: 1 } }
//     ]);

//     /* ================= RESPUESTA FINAL ================= */
//     res.json({
//       summary: {
//         today: today[0]?.total || 0,
//         week: week[0]?.total || 0,
//         month: month[0]?.total || 0
//       },
//       dailySales: dailySales.map(d => ({
//         date: d._id,
//         total: d.total
//       })),
//       // Información del vendedor necesaria para el Link y el QR en el Frontend
//       seller: {
//         slug: req.user.slug,
//         storeName: req.user.storeName
//       }
//     });

//   } catch (error) {
//     console.error("Dashboard error:", error);
//     res.status(500).json({ message: "Error al cargar dashboard" });
//   }
// };

// module.exports = { getSellerDashboard };
// const Order = require("../../../models/Order");
// const Productos = require("../../../models/Productos");
// const Usuario = require("../../../models/User");

// const getSellerDashboard = async (req, res) => {
//   try {
//     const sellerId = req.user._id;

//     const productCount = await Productos.countDocuments({ vendedor: sellerId });
//     const sellerData = await Usuario.findById(sellerId).populate("subscriptionPlan");

//     const match = {
//       "products.seller": sellerId,
//       status: { $in: ["paid", "processing", "shipped", "delivered"] }
//     };

//     const startToday = new Date();
//     startToday.setHours(0, 0, 0, 0);

//     const startMonth = new Date();
//     startMonth.setDate(1);
//     startMonth.setHours(0, 0, 0, 0);

//     const [todayData, monthData] = await Promise.all([
//       Order.aggregate([
//         { $match: match },
//         { $unwind: "$products" },
//         { $match: { "products.seller": sellerId, createdAt: { $gte: startToday } } },
//         { $group: { _id: null, total: { $sum: { $multiply: [{ $toDouble: "$products.price" }, "$products.quantity"] } } } }
//       ]),
//       Order.aggregate([
//         { $match: match },
//         { $unwind: "$products" },
//         { $match: { "products.seller": sellerId, createdAt: { $gte: startMonth } } },
//         { $group: { _id: null, total: { $sum: { $multiply: [{ $toDouble: "$products.price" }, "$products.quantity"] } } } }
//       ])
//     ]);

//     const dailySales = await Order.aggregate([
//       { $match: match },
//       { $unwind: "$products" },
//       { $match: { "products.seller": sellerId } },
//       {
//         $group: {
//           _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
//           total: { $sum: { $multiply: [{ $toDouble: "$products.price" }, "$products.quantity"] } }
//         }
//       },
//       { $sort: { _id: 1 } }
//     ]);

//     /* ================= LÓGICA MÁS VENDIDOS CORREGIDA ================= */
//     const topProductsRaw = await Order.aggregate([
//       { $match: match },
//       { $unwind: "$products" },
//       { $match: { "products.seller": sellerId } },
//       {
//         $lookup: {
//           from: "productos", // Nombre de la colección en la DB
//           localField: "products.product", // El campo que vimos en tu objeto de la orden
//           foreignField: "_id",
//           as: "infoProducto"
//         }
//       },
//       { $unwind: { path: "$infoProducto", preserveNullAndEmptyArrays: true } },
//       {
//         $group: {
//           _id: "$products.product",
//           name: { $first: "$products.productName" },
//           image: { $first: "$infoProducto.image" }, // Traemos la imagen real del esquema de Producto
//           price: { $first: "$products.price" },
//           salesCount: { $sum: "$products.quantity" }
//         }
//       },
//       { $sort: { salesCount: -1 } },
//       { $limit: 5 }
//     ]);

//     const topProducts = topProductsRaw.map(p => {
//       let finalUrl = "";
//       if (Array.isArray(p.image) && p.image.length > 0) {
//         finalUrl = p.image[0].url;
//       } else if (p.image && p.image.url) {
//         finalUrl = p.image.url;
//       } else {
//         finalUrl = "https://via.placeholder.com/150?text=Sin+Imagen";
//       }

//       return {
//         name: p.name,
//         image: finalUrl,
//         price: p.price,
//         salesCount: p.salesCount
//       };
//     });

//     res.json({
//       summary: {
//         totalMonth: monthData[0]?.total || 0,
//         today: todayData[0]?.total || 0,
//         productCount: productCount,
//         orderCount: monthData.length > 0 ? monthData.length : 0,
//         salesTrend: 0,
//         visitCount: 0, 
//         visitTrend: 0
//       },
//       dailySales: dailySales.map(d => ({
//         date: d._id,
//         total: d.total
//       })),
//       topProducts: topProducts,
//       seller: {
//         slug: sellerData?.slug || "",
//         storeName: sellerData?.storeName || "Mi Tienda",
//         subscriptionPlan: sellerData?.subscriptionPlan
//       }
//     });

//   } catch (error) {
//     console.error("Dashboard error:", error);
//     res.status(500).json({ message: "Error al cargar dashboard" });
//   }
// };

// module.exports = { getSellerDashboard };
const Order = require("../../../models/Order");
const Productos = require("../../../models/Productos");
const Usuario = require("../../../models/User");

/* =========================================================
   VENTAS DIARIAS + TENDENCIA
========================================================= */
const getDailySales = async (sellerId) => {
  const match = {
    "products.seller": sellerId,
    status: { $in: ["paid", "processing", "shipped", "delivered"] }
  };

  const dailySales = await Order.aggregate([
    { $match: match },
    { $unwind: "$products" },
    { $match: { "products.seller": sellerId } },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
        },
        total: {
          $sum: {
            $multiply: [
              { $toDouble: "$products.price" },
              "$products.quantity"
            ]
          }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return dailySales.map((d, i, arr) => ({
    date: d._id,
    total: d.total,
    trend: i === 0 ? d.total : arr[i - 1].total
  }));
};

/* =========================================================
   TOP PRODUCTOS
========================================================= */
const getTopProducts = async (sellerId, limit = 5) => {
  const match = {
    "products.seller": sellerId,
    status: { $in: ["paid", "processing", "shipped", "delivered"] }
  };

  const topProductsRaw = await Order.aggregate([
    { $match: match },
    { $unwind: "$products" },
    { $match: { "products.seller": sellerId } },
    {
      $lookup: {
        from: "productos",
        localField: "products.product",
        foreignField: "_id",
        as: "infoProducto"
      }
    },
    { $unwind: { path: "$infoProducto", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: "$products.product",
        name: { $first: "$products.productName" },
        image: { $first: "$infoProducto.image" },
        price: { $first: "$products.price" },
        salesCount: { $sum: "$products.quantity" }
      }
    },
    { $sort: { salesCount: -1 } },
    { $limit: limit }
  ]);

  return topProductsRaw.map(p => ({
    name: p.name,
    image:
      Array.isArray(p.image) && p.image.length
        ? p.image[0].url
        : p.image?.url || "https://via.placeholder.com/150",
    price: p.price,
    salesCount: p.salesCount
  }));
};

/* =========================================================
   ÓRDENES RECIENTES
========================================================= */
const getRecentOrders = async (sellerId, limit = 5) => {
  return Order.find({
    "products.seller": sellerId.toString()
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("orderNumber user total status createdAt")
    .populate("user", "name")
    .lean();
};


/* =========================================================
   DASHBOARD PRINCIPAL
========================================================= */
const getSellerDashboard = async (req, res) => {
  try {
    const sellerId = req.user._id;
console.log("USER EN DASHBOARD:", req.user);
    const [productCount, sellerData] = await Promise.all([
      Productos.countDocuments({ vendedor: sellerId }),
      Usuario.findById(sellerId).populate("subscriptionPlan").lean()
    ]);

    const startToday = new Date();
    startToday.setHours(0, 0, 0, 0);

    const startMonth = new Date();
    startMonth.setDate(1);
    startMonth.setHours(0, 0, 0, 0);

    const [
      todayData,
      monthData,
      dailySales,
      topProducts,
      recentOrders
    ] = await Promise.all([

      // Ventas hoy
      Order.aggregate([
        {
          $match: {
            "products.seller": sellerId,
            status: { $in: ["paid","processing","shipped","delivered"] },
            createdAt: { $gte: startToday }
          }
        },
        { $unwind: "$products" },
        { $match: { "products.seller": sellerId } },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $multiply: [
                  { $toDouble: "$products.price" },
                  "$products.quantity"
                ]
              }
            }
          }
        }
      ]),

      // Ventas del mes
      Order.aggregate([
        {
          $match: {
            "products.seller": sellerId,
            status: { $in: ["paid","processing","shipped","delivered"] },
            createdAt: { $gte: startMonth }
          }
        },
        { $unwind: "$products" },
        { $match: { "products.seller": sellerId } },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $multiply: [
                  { $toDouble: "$products.price" },
                  "$products.quantity"
                ]
              }
            }
          }
        }
      ]),

      getDailySales(sellerId),
      getTopProducts(sellerId),
      getRecentOrders(sellerId)
    ]);

    res.json({
      summary: {
        today: todayData[0]?.total || 0,
        totalMonth: monthData[0]?.total || 0,
        productCount,
        orderCount: recentOrders.length
      },
      dailySales,
      topProducts,
      recentOrders,
      seller: {
        slug: sellerData?.slug || "",
        storeName: sellerData?.storeName || "Mi Tienda",
        subscriptionPlan: sellerData?.subscriptionPlan || null
      }
    });

  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ message: "Error al cargar dashboard" });
  }
};

module.exports = { getSellerDashboard };
