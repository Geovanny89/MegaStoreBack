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
    // Construimos un array de paymentMethods dinámico
    const paymentMethods = [];

    if (req.body["paymentMethods.nequi.value"] || req.files?.nequiQR?.[0]) {
      paymentMethods.push({
        provider: "nequi",
        type: "phone",
        value: req.body["paymentMethods.nequi.value"] || req.body.phone || "",
        qr: req.files?.nequiQR?.[0]
          ? await uploadBufferToCloudinary(
              req.files.nequiQR[0].buffer,
              "payments/qr/nequi"
            )
          : null,
        active: true
      });
    }

    if (req.body["paymentMethods.llaves.value"] || req.files?.llavesQR?.[0]) {
      paymentMethods.push({
        provider: "llaves", // aquí tu nuevo nombre de provider
        type: "random",
        value: req.body["paymentMethods.llaves.value"] || req.body.phone || "",
        qr: req.files?.llavesQR?.[0]
          ? await uploadBufferToCloudinary(
              req.files.llavesQR[0].buffer,
              "payments/qr/llaves"
            )
          : null,
        active: true
      });
    }

    if (paymentMethods.length > 0) {
      updates.paymentMethods = paymentMethods;
    }

    /* ================= ACTUALIZAR ================= */
    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true }
    );

    return res.json({
      message: "Perfil del vendedor actualizado correctamente",
      data: updated
    });

  } catch (error) {
    console.error("❌ Error actualizando vendedor:", error);
    return res.status(500).json({ message: "Error al actualizar perfil" });
  }
};





module.exports = {
  getPerfilVendedor,
  updatePerfilVendedor,
};
