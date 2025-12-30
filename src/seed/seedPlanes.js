
const Planes = require('../models/Planes');

const seedPlanes = async () => {
  try {
    const count = await Planes.countDocuments();
    if (count === 0) {
      await Planes.insertMany([
        { nombre: 'Emprendedor', precio: 39000, productos_permitidos: 20, duracion_meses: 1 },
        { nombre: 'Premium', precio: 79900, productos_permitidos: 80, duracion_meses: 1 }
      ]);
      console.log('Planes insertados correctamente');
    }
  } catch (error) {
    console.error('Error al insertar planes:', error);
  }
};

module.exports = seedPlanes;
