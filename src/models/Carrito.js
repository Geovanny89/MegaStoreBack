const { mongoose, Schema } = require('mongoose');

const carritoSchema = mongoose.Schema({
  items: [
    {
      product: {
        type: Schema.Types.ObjectId,
        ref: 'Productos',
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        default: 1,
      },
    }
  ],
  user: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario', // Asociar con tu modelo de usuario si es necesario
  },
});

module.exports = mongoose.model('Carrito', carritoSchema);
