const Suscripciones = require('../../models/Suscripcion');
const Planes = require('../../models/Planes');
const Usuarios = require('../../models/User');

// Crear suscripción (solo para sellers)
const crearSuscripcion = async (req, res) => {
  try {
    const { usuarioId, planNombre } = req.body;

    // 0. Verificar que el usuario exista y sea seller
    const usuario = await Usuarios.findById(usuarioId);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    if (usuario.rol !== 'seller') {
      return res.status(403).json({ message: 'Solo los vendedores pueden tener suscripción' });
    }

    // 1. Buscar el plan por nombre
    const plan = await Planes.findOne({ nombre: planNombre, estado: 'activo' });
    if (!plan) {
      return res.status(404).json({ message: 'Plan no encontrado' });
    }

    // 🔥 2. INVALIDAR SUSCRIPCIONES ANTERIORES (PARTE FALTANTE)
    await Suscripciones.updateMany(
      { id_usuario: usuarioId, estado: "activa" },
      { estado: "vencida" }
    );

    // 3. Calcular fecha de vencimiento
    const fechaInicio = new Date();
    const fechaVencimiento = new Date();
    fechaVencimiento.setMonth(fechaVencimiento.getMonth() + plan.duracion_meses);

    // 4. Crear nueva suscripción activa
    const suscripcion = await Suscripciones.create({
      id_usuario: usuarioId,
      plan_id: plan._id,
      fecha_inicio: fechaInicio,
      fecha_vencimiento: fechaVencimiento,
      estado: 'activa'
    });

    res.status(201).json({
      message: 'Suscripción creada correctamente',
      suscripcion
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear la suscripción' });
  }
};

module.exports = {
  crearSuscripcion
};
