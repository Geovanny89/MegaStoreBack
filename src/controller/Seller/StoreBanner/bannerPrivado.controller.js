const User = require("../../../models/User");
const { obtenerBannersPublicos } = require("./storeBanner.controller");

const getStorefront = async (req, res) => {
  try {
    const { slug } = req.params;

    const seller = await User.findOne({
      slug,
      rol: "seller",
      sellerStatus: { $in: ["active", "trial", "pending_payment"] }
    }).select("-password");

    if (!seller) {
      return res.status(404).json({ message: "Tienda no encontrada" });
    }

    const banners = await obtenerBannersPublicos(seller._id);

    res.json({
      seller,
      banners
    });
  } catch (err) {
    console.error("Error en getStorefront:", err);
    res.status(500).json({ message: "Error del servidor" });
  }
};

module.exports = {
  getStorefront
};
