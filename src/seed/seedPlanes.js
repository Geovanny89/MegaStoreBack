
const Planes = require('../models/Planes');

const seedPlanes = async () => {
  try {
    const count = await Planes.countDocuments();
    if (count === 0) {
      await Planes.insertMany([
        { nombre: 'basico', precio: 45000, productos_permitidos: 15, duracion_meses: 1 },
        { nombre: 'avanzado', precio: 70000, productos_permitidos: 50, duracion_meses: 1 }
      ]);
      console.log('Planes insertados correctamente');
    }
  } catch (error) {
    console.error('Error al insertar planes:', error);
  }
};

module.exports = seedPlanes;
