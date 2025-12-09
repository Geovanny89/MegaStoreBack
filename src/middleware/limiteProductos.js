const Suscripciones = require('../models/Suscripcion');

const verificarLimiteProductos = async (req, res, next) => {
  try {
    const usuarioId = req.user.id; // se asume que tienes auth middleware
    const productosActuales = req.body.productosActuales; // o calculado desde la DB

    // Buscar suscripción activa
    const suscripcion = await Suscripciones.findOne({ id_usuario: usuarioId, estado: 'activa' });

    if (!suscripcion) {
      return res.status(403).json({ message: 'No tienes suscripción activa. Renueva tu plan para crear productos.' });
    }

    const hoy = new Date();
    if (suscripcion.fecha_vencimiento < hoy) {
      // marcar como vencida
      suscripcion.estado = 'vencida';
      await suscripcion.save();
      return res.status(403).json({ message: 'Tu suscripción ha vencido. Renueva tu plan para crear productos.' });
    }

    const limite = suscripcion.plan_id.productos_permitidos;
    if (productosActuales >= limite) {
      return res.status(403).json({ message: `Has alcanzado el límite de ${limite} productos para tu plan` });
    }

    next(); // todo bien
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error verificando suscripción' });
  }
};

module.exports = verificarLimiteProductos;
