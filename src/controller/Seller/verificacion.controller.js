const User = require("../../models/User");
const cloudinary = require("../../utils/cloudinary");

const retryIdentity = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const files = req.files;

    if (
      !files ||
      !files.idDocumentFront ||
      !files.selfieWithPaper
    ) {
      return res.status(400).json({
        message: "Debe enviar todos los documentos requeridos"
      });
    }

    const seller = await User.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (seller.rol !== "seller") {
      return res.status(403).json({ message: "No autorizado" });
    }

    /* =========================================
       🧹 ELIMINAR IMÁGENES ANTERIORES (SI EXISTEN)
    ========================================= */
    if (seller.verification?.idDocumentFront?.public_id) {
      await cloudinary.uploader.destroy(
        seller.verification.idDocumentFront.public_id
      );
    }

    if (seller.verification?.selfieWithPaper?.public_id) {
      await cloudinary.uploader.destroy(
        seller.verification.selfieWithPaper.public_id
      );
    }

    /* =========================================
       ☁️ SUBIR DOCUMENTO FRONTAL
    ========================================= */
    const idFrontResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "identity_documents",
          resource_type: "image"
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      stream.end(files.idDocumentFront[0].buffer);
    });

    /* =========================================
       ☁️ SUBIR SELFIE
    ========================================= */
    const selfieResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "identity_documents",
          resource_type: "image"
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      stream.end(files.selfieWithPaper[0].buffer);
    });

    /* =========================================
       🔄 ACTUALIZAR SELLER
    ========================================= */
    seller.verification.idDocumentFront = {
      url: idFrontResult.secure_url,
      public_id: idFrontResult.public_id
    };

    seller.verification.selfieWithPaper = {
      url: selfieResult.secure_url,
      public_id: selfieResult.public_id
    };

    seller.verification.isVerified = false;
    seller.verification.verificationReason = null;
    seller.verification.verifiedAt = null;

    seller.sellerStatus = "pending_identity";

    await seller.save();

    res.json({
      message: "Documentos reenviados correctamente. En revisión.",
      documents: {
        idDocumentFront: idFrontResult.secure_url,
        selfieWithPaper: selfieResult.secure_url
      }
    });

  } catch (error) {
    console.error("❌ Error retryIdentity:", error);
    res.status(500).json({ message: "Error reenviando documentos" });
  }
};

module.exports = { retryIdentity };
