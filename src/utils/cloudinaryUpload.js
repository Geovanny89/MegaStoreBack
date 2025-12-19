const cloudinary = require("../utils/cloudinary");

const uploadBufferToCloudinary = (buffer, folder, mimetype) => {
  return new Promise((resolve, reject) => {
    const isPdf = mimetype === "application/pdf";

    const upload = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: isPdf ? "raw" : "image"
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );

    upload.end(buffer);
  });
};

module.exports = uploadBufferToCloudinary;
