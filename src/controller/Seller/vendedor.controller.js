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

    /* ================= TELÉFONOS DE PAGO ================= */

    if (req.body["paymentMethods.nequi.phone"]) {
      updates["paymentMethods.nequi.phone"] =
        req.body["paymentMethods.nequi.phone"];
    }

    if (req.body["paymentMethods.daviplata.phone"]) {
      updates["paymentMethods.daviplata.phone"] =
        req.body["paymentMethods.daviplata.phone"];
    }

    /* ================= QR NEQUI ================= */

    if (req.files?.nequiQR?.[0]) {
      const nequiQRUrl = await uploadBufferToCloudinary(
        req.files.nequiQR[0].buffer,
        "payments/qr/nequi"
      );
      updates["paymentMethods.nequi.qr"] = nequiQRUrl;
    }

    /* ================= QR DAVIPLATA ================= */

    if (req.files?.daviplataQR?.[0]) {
      const daviplataQRUrl = await uploadBufferToCloudinary(
        req.files.daviplataQR[0].buffer,
        "payments/qr/daviplata"
      );
      updates["paymentMethods.daviplata.qr"] = daviplataQRUrl;
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
    return res.status(500).json({
      message: "Error al actualizar perfil"
    });
  }
};



module.exports = {
  getPerfilVendedor,
  updatePerfilVendedor,
};
