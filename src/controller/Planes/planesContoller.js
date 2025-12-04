const Planes = require('../../models/Planes');

const getPlanesActivos = async (req, res) => {
  try {
    const planes = await Planes.find();
    res.json(planes);
  } catch (error) {
    console.error("Error obteniendo planes:", error);
    res.status(500).json({ message: "Error al obtener los planes" });
  }
};

module.exports = { getPlanesActivos };
    