const { mongoose } = require('mongoose')
const addressSchema = require("./Address");
const userSchema = mongoose.Schema({
    name: {
        type: String,
        require: true
    },
    lastName: {
        type: String
    },
    identity: {
        type: String
    },
    email: {
        type: String
    },
    password: {
        type: String
    },
    phone: {
        type: String
    },
      // varias direcciones
    addresses: [addressSchema],
    rol: {
        type: String,
        enum: ["user", "seller", "admin"],
        required: true
    },

    // solo sellers usan este campo
    storeName: {
        type: String,
        default: null
    },
})


module.exports = mongoose.model('User', userSchema)