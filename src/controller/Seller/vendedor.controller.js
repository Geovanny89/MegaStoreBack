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

    /* ================= DATOS BÁSICOS ================= */
    if (req.body.name) vendedor.name = req.body.name;
    if (req.body.lastName) vendedor.lastName = req.body.lastName;
    if (req.body.phone) vendedor.phone = req.body.phone;
    if (req.body.storeName) vendedor.storeName = req.body.storeName;
    if (req.body.storeDescription !== undefined) {
  vendedor.storeDescription = req.body.storeDescription.trim();
}

    /* ================= MÉTODOS DE PAGO ================= */
    let methods = vendedor.paymentMethods || [];

    /* 🔹 CONTRAENTREGA */
  /* 🔹 CONTRAENTREGA */
const codIndex = methods.findIndex(m => m.type === "cod");

if (req.body["paymentMethods.cod.active"] === "true") {
  const cities = req.body["paymentMethods.cod.cities"]
    ? req.body["paymentMethods.cod.cities"]
        .split(",")
        .map(c => c.trim())
        .filter(Boolean)
    : [];

  const codData = {
    provider: "cod",
    type: "cod",
    active: true,
    cities,
    note: req.body["paymentMethods.cod.note"] || ""
  };

  if (codIndex >= 0) {
    methods[codIndex] = { ...methods[codIndex]._doc, ...codData };
  } else {
    methods.push(codData);
  }
} else {
  // 🔴 AQUÍ ESTABA EL PROBLEMA
  if (codIndex >= 0) {
    methods[codIndex].active = false;
  }
}


    /* 🔹 NEQUI */
    if (req.body["paymentMethods.nequi.value"] || req.files?.nequiQR?.[0]) {
      const nequiQR = req.files?.nequiQR?.[0]
        ? await uploadBufferToCloudinary(
            req.files.nequiQR[0].buffer,
            "payments/qr/nequi"
          )
        : null;

      const nequiIndex = methods.findIndex(m => m.provider === "nequi");

      const nequiData = {
        provider: "nequi",
        type: "phone",
        value: req.body["paymentMethods.nequi.value"] || vendedor.phone || "",
        qr: nequiQR,
        active: true
      };

      if (nequiIndex >= 0) {
        methods[nequiIndex] = { ...methods[nequiIndex]._doc, ...nequiData };
      } else {
        methods.push(nequiData);
      }
    }

    /* 🔹 LLAVES */
    if (req.body["paymentMethods.llaves.value"] || req.files?.llavesQR?.[0]) {
      const llavesQR = req.files?.llavesQR?.[0]
        ? await uploadBufferToCloudinary(
            req.files.llavesQR[0].buffer,
            "payments/qr/llaves"
          )
        : null;

      const llavesIndex = methods.findIndex(m => m.provider === "llaves");

      const llavesData = {
        provider: "llaves",
        type: "random",
        value: req.body["paymentMethods.llaves.value"] || vendedor.phone || "",
        qr: llavesQR,
        active: true
      };

      if (llavesIndex >= 0) {
        methods[llavesIndex] = { ...methods[llavesIndex]._doc, ...llavesData };
      } else {
        methods.push(llavesData);
      }
    }

    vendedor.paymentMethods = methods;

    await vendedor.save();

    return res.json({
      message: "Perfil del vendedor actualizado correctamente",
      data: vendedor
    });

  } catch (error) {
    console.error("❌ Error actualizando vendedor:", error);
    return res.status(500).json({
      message: error.message || "Error al actualizar perfil"
    });
  }
};






module.exports = {
  getPerfilVendedor,
  updatePerfilVendedor,
};
