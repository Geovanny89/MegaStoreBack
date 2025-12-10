const User = require("../../models/User");

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

    const updated = await User.findByIdAndUpdate(
      userId,
      req.body,
      { new: true }
    );

    res.json({
      message: "Perfil de vendedor actualizado",
      data: updated
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al actualizar perfil" });
  }
};

module.exports = {
  getPerfilVendedor,
  updatePerfilVendedor,
};
