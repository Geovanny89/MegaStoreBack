const {mongoose} = require('mongoose')

const orderSchema = mongoose.Schema({
    products: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: 'Productos', required: true },
            quantity: { type: Number, required: true }
        }
    ],
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    total: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
})
module.exports= mongoose.model('Order',orderSchema);