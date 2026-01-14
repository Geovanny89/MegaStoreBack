const Suscripciones = require('../../models/Suscripcion');
const Planes = require('../../models/Planes');
const Usuarios = require('../../models/User');

// Crear suscripción (solo para sellers)
const crearSuscripcion = async (req, res) => {
  try {
    const { usuarioId, planNombre } = req.body;

    // 0️⃣ Validar usuario
    const usuario = await Usuarios.findById(usuarioId);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    if (usuario.rol !== 'seller') {
      return res.status(403).json({
        message: 'Solo los vendedores pueden tener suscripción'
      });
    }

    // 1️⃣ Buscar plan
    const plan = await Planes.findOne({
      nombre: planNombre,
      estado: 'activo'
    });

    if (!plan) {
      return res.status(404).json({ message: 'Plan no encontrado' });
    }

    // 🔥 2️⃣ Invalidar CUALQUIER suscripción previa
    await Suscripciones.updateMany(
      { id_usuario: usuarioId, estado: { $in: ['activa', 'pendiente'] } },
      { estado: 'vencida' }
    );

    // 3️⃣ Fechas del TRIAL (5 días)
    const fechaInicio = new Date();
    const fechaVencimiento = new Date();
    fechaVencimiento.setDate(fechaInicio.getDate() + 10);

    // 4️⃣ Crear suscripción GRATIS
    const suscripcion = await Suscripciones.create({
      id_usuario: usuarioId,
      plan_id: plan._id,
      fecha_inicio: fechaInicio,
      fecha_vencimiento: fechaVencimiento,
      estado: 'trial' // 👈 activa solo durante el trial
    });

    res.status(201).json({
      message: 'Suscripción creada con 5 días gratis',
      suscripcion
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error al crear la suscripción'
    });
  }
};


const activarSuscripcionPago = async (req, res) => {
  const { suscripcionId } = req.body;

  const suscripcion = await Suscripciones
    .findById(suscripcionId)
    .populate('plan_id');

  if (!suscripcion) {
    return res.status(404).json({ message: 'Suscripción no encontrada' });
  }

  const inicio = new Date();
  const vencimiento = new Date();
  vencimiento.setMonth(
    vencimiento.getMonth() + suscripcion.plan_id.duracion_meses
  );

  suscripcion.estado = 'activa';
  suscripcion.fecha_inicio = inicio;
  suscripcion.fecha_vencimiento = vencimiento;

  await suscripcion.save();

  res.json({
    message: 'Suscripción activada por 30 días'
  });
};


module.exports = {
  crearSuscripcion,
  activarSuscripcionPago,
};
