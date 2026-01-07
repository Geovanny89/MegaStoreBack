// middlewares/uploadImport.js
const multer = require("multer");

const uploadImport = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 60 * 1024 * 1024 } // 60 MB
});

module.exports = uploadImport.fields([
  { name: "excel", maxCount: 1 },
  { name: "images", maxCount: 1 }
]);
