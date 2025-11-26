
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

    // Validar si el producto existe
    const product = await Productos.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado." });
    }

    const newQuestion = await ProductQuestion.create({
      productId,
      userId,
      question
    });

    res.status(201).json(newQuestion);

  } catch (error) {
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

    const question = await ProductQuestion.findById(id);

    if (!question) {
      return res.status(404).json({ message: "Pregunta no encontrada." });
    }

    // Guardar respuesta
    question.answer = answer;
    question.answeredBy = sellerId;
    question.answeredAt = new Date();
    await question.save();

    res.json(question);

  } catch (error) {
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
// const getQuestionsForSeller = async (req, res) => {
//   try {
//     const sellerId = req.user.id;

//     // Obtener productos del vendedor
//     const sellerProducts = await Productos.find({ sellerId }).select("_id");

//     const productIds = sellerProducts.map(p => p._id);

//     const questions = await ProductQuestion.find({ productId: { $in: productIds } })
//       .populate("userId", "name lastName")
//       .populate("productId", "name price")
//       .sort({ createdAt: -1 });

//     res.json(questions);

//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };



// ======================================================
// 6. Eliminar pregunta (solo admin o el usuario que la creó)
// ======================================================
const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.rol;

    const question = await ProductQuestion.findById(id);

    if (!question) {
      return res.status(404).json({ message: "Pregunta no encontrada." });
    }

    if (question.userId.toString() !== userId && userRole !== "admin") {
      return res.status(403).json({ message: "No autorizado para eliminar esta pregunta." });
    }

    await ProductQuestion.findByIdAndDelete(id);

    res.json({ message: "Pregunta eliminada correctamente." });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
module.exports = {
  createQuestion,
  answerQuestion,
  getQuestionsByProduct,
  getQuestionsByUser,
  // getQuestionsForSeller,
  deleteQuestion
};