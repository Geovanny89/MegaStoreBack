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
        enum: ["user", "admin", "seller"],
        default: "user"
    },
  // solo para sellers
    storeName: { type: String },
})


module.exports = mongoose.model('User', userSchema)