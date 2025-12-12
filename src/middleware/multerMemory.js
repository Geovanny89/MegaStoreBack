const multer = require("multer");

const storage = multer.memoryStorage(); // 🔥 NO CREA ARCHIVO LOCAL

module.exports = multer({ storage });
