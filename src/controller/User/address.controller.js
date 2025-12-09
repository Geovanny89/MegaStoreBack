const User = require("../../models/User");

// ➤ AGREGAR DIRECCIÓN
const agregarDireccion = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const { label, street, city, state, postalCode, reference, isDefault } = req.body;

    if (!street || !city) {
      return res.status(400).json({ message: "Faltan datos obligatorios" });
    }

    // Si el usuario quiere marcarla como principal
    if (isDefault === true) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    // Si es la primera dirección, será default automáticamente
    const defaultValue = user.addresses.length === 0 ? true : !!isDefault;

    user.addresses.push({
      label,
      street,
      city,
      state,
      postalCode,
      reference,
      isDefault: defaultValue
    });

    await user.save();

    res.status(201).json({
      message: "Dirección agregada correctamente",
      addresses: user.addresses
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error agregando dirección" });
  }
};


/**********************************
 * ➤ EDITAR DIRECCIÓN
 **********************************/
const editarDireccion = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const addressId = req.params.addressId;
    const updates = req.body;

    const direccion = user.addresses.id(addressId);
    if (!direccion) {
      return res.status(404).json({ message: "Dirección no encontrada" });
    }

    // Si el usuario marca esta como principal, desmarcar otras
    if (updates.isDefault === true) {
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    Object.assign(direccion, updates);

    await user.save();

    res.json({
      message: "Dirección actualizada",
      addresses: user.addresses
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error editando dirección" });
  }
};



/**********************************
 * ➤ ELIMINAR DIRECCIÓN
 **********************************/
const eliminarDireccion = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const addressId = req.params.addressId;

    const direccion = user.addresses.id(addressId);
    if (!direccion) {
      return res.status(404).json({ message: "Dirección no encontrada" });
    }

    const eraDefault = direccion.isDefault;

    direccion.deleteOne();
    await user.save();

    // Si se eliminó la default, ponemos otra como principal
    if (eraDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
      await user.save();
    }

    res.json({
      message: "Dirección eliminada",
      addresses: user.addresses
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error eliminando dirección" });
  }
};


/**********************************
 * ➤ ESTABLECER DIRECCIÓN POR DEFECTO
 **********************************/
const setDefaultAddress = async (req, res) => {
  try {
    const user = req.user;
    const addressId = req.params.addressId;

    const direccion = user.addresses.id(addressId);

    if (!direccion) {
      return res.status(404).json({ message: "Dirección no encontrada" });
    }

    // poner todas en false
    user.addresses.forEach(addr => (addr.isDefault = false));

    // poner esta como default
    direccion.isDefault = true;

    await user.save();

    res.json({
      message: "Dirección establecida como predeterminada",
      addresses: user.addresses
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error actualizando dirección" });
  }
};


/**********************************
 * ➤ LISTAR DIRECCIONES DEL USUARIO
 **********************************/
const obtenerDirecciones = async (req, res) => {
  try {
    const user = req.user;

    res.json({
      addresses: user.addresses
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo direcciones" });
  }
};


module.exports = { 
  agregarDireccion,
 editarDireccion,
  eliminarDireccion,
  setDefaultAddress,
  obtenerDirecciones
 };
