const User = require("../../models/User");
const cloudinary = require("../../utils/cloudinary");

const submitIdentity = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const files = req.files;

    if (!files || !files.idDocumentFront || !files.selfieWithPaper) {
      return res.status(400).json({
        message: "Debe enviar todos los documentos requeridos"
      });
    }

    const seller = await User.findById(sellerId);
    if (!seller) return res.status(404).json({ message: "Usuario no encontrado" });
    if (seller.rol !== "seller") return res.status(403).json({ message: "No autorizado" });

    /* =========================================
       ☁️ SUBIR DOCUMENTOS A CLOUDINARY
    ========================================= */
    const idFrontResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "identity_documents", resource_type: "image" },
        (error, result) => (error ? reject(error) : resolve(result))
      );
      stream.end(files.idDocumentFront[0].buffer);
    });

    const selfieResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "identity_documents", resource_type: "image" },
        (error, result) => (error ? reject(error) : resolve(result))
      );
      stream.end(files.selfieWithPaper[0].buffer);
    });

    /* =========================================
       🔄 GUARDAR EN LA DB
    ========================================= */
    seller.verification = {
      idDocumentFront: { url: idFrontResult.secure_url, public_id: idFrontResult.public_id },
      selfieWithPaper: { url: selfieResult.secure_url, public_id: selfieResult.public_id },
      isVerified: false,
      verificationReason: null,
      verifiedAt: null
    };

    seller.sellerStatus = "pending_identity";

    await seller.save();

    res.json({
      message: "Documentos enviados correctamente. En revisión.",
      documents: {
        idDocumentFront: idFrontResult.secure_url,
        selfieWithPaper: selfieResult.secure_url
      }
    });

  } catch (error) {
    console.error("❌ Error submitIdentity:", error);
    res.status(500).json({ message: "Error enviando documentos" });
  }
};

module.exports = { submitIdentity };
