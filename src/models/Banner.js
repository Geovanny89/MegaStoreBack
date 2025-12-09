const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: String,
  link: String,
  image: Buffer, // Almacena la imagen como un buffer
});

const Banner = mongoose.model('Banner', bannerSchema);

module.exports = Banner;
