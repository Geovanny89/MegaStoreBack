
const Notification = require("../../models/Notification");
const ProductQuestion = require("../../models/ProductQuestion");
const Productos = require("../../models/Productos");


// ======================================================
// 1. Crear una pregunta (solo usuarios autenticados)
// ======================================================


const createQuestion = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    const { question } = req.body;

    if (!question || question.trim() === "") {
      return res.status(400).json({ message: "La pregunta no puede estar vacía." });
    }

    const product = await Productos.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado." });
    }

    // 1️⃣ Guardar pregunta
    const newQuestion = await ProductQuestion.create({
      productId,
      userId,
      question
    });
    


    // 2️⃣ 🔔 NOTIFICACIÓN AL VENDEDOR
    await Notification.create({
      user: product.vendedor, // 👈 vendedor
      type: "question",
      product: product._id,
      message: `Nueva pregunta sobre "${product.name}"`,
      isRead: false
    });

    res.status(201).json(newQuestion);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};




// ======================================================
// 2. Responder una pregunta (solo vendedor o admin)
// ======================================================
const answerQuestion = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { id } = req.params;
    const { answer } = req.body;

    if (!answer || answer.trim() === "") {
      return res.status(400).json({ message: "La respuesta no puede estar vacía." });
    }

    const question = await ProductQuestion
      .findById(id)
      .populate("productId")
      .populate("userId");

    if (!question) {
      return res.status(404).json({ message: "Pregunta no encontrada." });
    }

    question.answer = answer;
    question.answeredBy = sellerId;
    question.answeredAt = new Date();
    await question.save();

    // 🔔 NOTIFICACIÓN AL COMPRADOR
    await Notification.create({
      user: question.userId._id,
      type: "question",
      product: question.productId._id,
      message: `Respondieron tu pregunta sobre "${question.productId.name}"`,
      isRead: false
    });

    res.json(question);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};


// ======================================================
// 3. Obtener preguntas de un producto
// ======================================================
const getQuestionsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const questions = await ProductQuestion.find({ productId })
      .populate("userId", "name lastName")
      .populate("answeredBy", "name lastName storeName")
      .sort({ createdAt: -1 });

    res.json(questions);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



// ======================================================
// 4. Obtener todas las preguntas hechas por un usuario
// ======================================================
const getQuestionsByUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const questions = await ProductQuestion.find({ userId })
      .populate("productId", "name price brand")
      .populate("answeredBy", "name storeName")
      .sort({ createdAt: -1 });

    res.json(questions);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



// ======================================================
// 5. Obtener preguntas recibidas por un vendedor
//    (preguntas de productos que él vende)
// ======================================================
const getQuestionsForSeller = async (req, res) => {
  try {
    const sellerId = req.user.id; // viene del token

    // 1️⃣ Productos del vendedor (CAMPO CORRECTO)
    const products = await Productos.find({
      vendedor: sellerId
    }).select("_id");

    const productIds = products.map(p => p._id);

    // 🛑 Si no hay productos, no hay preguntas
    if (productIds.length === 0) {
      return res.json([]);
    }

    // 2️⃣ Preguntas de esos productos
    const questions = await ProductQuestion.find({
      productId: { $in: productIds }
    })
      .populate("productId", "name")
      .sort({ createdAt: -1 });

    res.json(questions);

  } catch (error) {
    console.error("ERROR SELLER QUESTIONS:", error);
    res.status(500).json({ message: "Error al obtener preguntas" });
  }
};





// ======================================================
// 6. Eliminar pregunta (solo admin o el usuario que la creó)
// ======================================================
const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString(); // ✅ CORRECTO
    const userRole = req.user.rol;

    const question = await ProductQuestion.findById(id);

    if (!question) {
      return res.status(404).json({
        message: "Pregunta no encontrada."
      });
    }

    // ❌ Bloquear si ya fue respondida
    if (question.answer) {
      return res.status(400).json({
        message: "No puedes eliminar una pregunta que ya fue respondida."
      });
    }

    // 🔐 Solo autor o admin
    if (
      question.userId.toString() !== userId &&
      userRole !== "admin"
    ) {
      return res.status(403).json({
        message: "No autorizado para eliminar esta pregunta."
      });
    }

    await question.deleteOne(); // mejor que findByIdAndDelete

    res.json({
      message: "Pregunta eliminada correctamente."
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error interno del servidor"
    });
  }
};


module.exports = {
  createQuestion,
  answerQuestion,
  getQuestionsByProduct,
  getQuestionsByUser,
  getQuestionsForSeller,
  deleteQuestion
};