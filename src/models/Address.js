const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  label: String,
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: String,
  postalCode: String,
  reference: String,
  isDefault: { type: Boolean, default: false }
});

module.exports = addressSchema;
