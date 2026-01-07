const User = require("../../models/User");
const uploadBufferToCloudinary = require("../../utils/cloudinaryUpload");

const getPerfilVendedor = async (req, res) => {
  try {
    const userId = req.user.id;

    const vendedor = await User.findById(userId);

    if (!vendedor || vendedor.rol !== "seller") {
      return res.status(403).json({ message: "No autorizado" });
    }

    res.json(vendedor);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener perfil del vendedor" });
  }
};

const updatePerfilVendedor = async (req, res) => {
  try {
    const userId = req.user.id;

    const vendedor = await User.findById(userId);
    if (!vendedor || vendedor.rol !== "seller") {
      return res.status(403).json({ message: "No autorizado" });
    }

    const updates = {};

    /* ================= DATOS BÁSICOS ================= */
    if (req.body.name) updates.name = req.body.name;
    if (req.body.lastName) updates.lastName = req.body.lastName;
    if (req.body.phone) updates.phone = req.body.phone;
    if (req.body.storeName) updates.storeName = req.body.storeName;

    /* ================= MÉTODOS DE PAGO ================= */
    // 1. Iniciamos el array SIEMPRE con el método Contraentrega
    const paymentMethods = [
      {
        provider: "cod",
        type: "cod",
        value: "Efectivo",
        active: true
      }
    ];

    // 2. Agregamos Nequi si viene en el body
    if (req.body["paymentMethods.nequi.value"] || req.files?.nequiQR?.[0]) {
      paymentMethods.push({ 
        provider: "nequi",
        type: "phone",
        value: req.body["paymentMethods.nequi.value"] || req.body.phone || "",
        qr: req.files?.nequiQR?.[0]
          ? await uploadBufferToCloudinary(req.files.nequiQR[0].buffer, "payments/qr/nequi")
          : null,
        active: true
      });
    }

    // 3. Agregamos Llaves si viene en el body
    if (req.body["paymentMethods.llaves.value"] || req.files?.llavesQR?.[0]) {
      paymentMethods.push({
        provider: "llaves",
        type: "random",
        value: req.body["paymentMethods.llaves.value"] || req.body.phone || "",
        qr: req.files?.llavesQR?.[0]
          ? await uploadBufferToCloudinary(req.files.llavesQR[0].buffer, "payments/qr/llaves")
          : null,
        active: true
      });
    }

    // Guardamos los métodos (que ahora garantizan tener COD)
    updates.paymentMethods = paymentMethods;

    /* ================= ACTUALIZAR ================= */
    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true } // Importante: runValidators para que el modelo verifique el array
    );

    return res.json({
      message: "Perfil del vendedor actualizado (Contraentrega incluido por defecto)",
      data: updated
    });

  } catch (error) {
    console.error("❌ Error actualizando vendedor:", error);
    return res.status(500).json({ message: error.message || "Error al actualizar perfil" });
  }
};






module.exports = {
  getPerfilVendedor,
  updatePerfilVendedor,
};
