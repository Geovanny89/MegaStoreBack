const mongoose = require('mongoose');

const productQuestionSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Productos',
        required: true
    },

    // usuario que hizo la pregunta
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    question: {
        type: String,
        required: true
    },

    // respuesta del vendedor
    answer: {
        type: String,
        default: null
    },

    // vendedor que respondió
    answeredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    answeredAt: {
        type: Date,
        default: null
    }
});

module.exports = mongoose.model('ProductQuestion', productQuestionSchema);
