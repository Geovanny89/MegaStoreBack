const Campaign = require("../../../models/Campaign");
const Productos = require("../../../models/Productos");

/* =====================================================
   CREAR DESCUENTO / CAMPAÑA
===================================================== */
const createDescuento = async (req, res) => {
  try {
    const {
      name,
      type,
      value,
      productos,
      startDate,
      endDate
    } = req.body;

    if (!name || !type || !value || !productos?.length || !startDate || !endDate) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    if (value <= 0) {
      return res.status(400).json({ error: "El valor del descuento debe ser mayor a 0" });
    }

    // (Opcional) Validar que los productos pertenezcan al vendedor
    const count = await Productos.countDocuments({
      _id: { $in: productos },
      vendedor: req.user.id
    });

    if (count !== productos.length) {
      return res.status(403).json({ error: "Algunos productos no te pertenecen" });
    }

    const descuento = await Campaign.create({
      name,
      type,
      value,
      productos,
      startDate,
      endDate,
      vendedor: req.user.id
    });

    res.status(201).json(descuento);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear el descuento" });
  }
};

const updateDescuento = async (req, res) => {
  try {
    const { id } = req.params;

    const descuento = await Campaign.findOne({
      _id: id,
      vendedor: req.user.id
    });

    if (!descuento) {
      return res.status(404).json({ error: "Descuento no encontrado" });
    }

    Object.assign(descuento, req.body);

    await descuento.save();

    res.json(descuento);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar el descuento" });
  }
};
const deleteDescuento = async (req, res) => {
  try {
    const { id } = req.params;

    const descuento = await Campaign.findOneAndDelete({
      _id: id,
      vendedor: req.user.id
    });

    if (!descuento) {
      return res.status(404).json({ error: "Descuento no encontrado" });
    }

    res.json({ message: "Descuento eliminado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar el descuento" });
  }
};

const toggleDescuento = async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;

    if (typeof active !== "boolean") {
      return res.status(400).json({ error: "Estado inválido" });
    }

    const descuento = await Campaign.findOneAndUpdate(
      { _id: id, vendedor: req.user.id },
      { active },
      { new: true }
    );

    if (!descuento) {
      return res.status(404).json({ error: "Descuento no encontrado" });
    }

    res.json(descuento);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al cambiar el estado" });
  }
};
const getMyDescuentos = async (req, res) => {
  try {
    const descuentos = await Campaign.find({
      vendedor: req.user.id
    }).sort({ createdAt: -1 });

    res.json(descuentos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener descuentos" });
  }
};


module.exports = {
    createDescuento,
    updateDescuento,
    deleteDescuento,
    toggleDescuento,
    getMyDescuentos
}