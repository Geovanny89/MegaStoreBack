const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middleware/sesion");

const {
  createQuestion,
  answerQuestion,
  getQuestionsByProduct,
  getQuestionsByUser,
  // getQuestionsForSeller,
  deleteQuestion,
  getQuestionsForSeller
} = require("../../controller/Questions/productQuestionController");

// ================================
// USUARIO
// ================================

// Preguntas hechas por el usuario autenticado
router.get("/questions/user/me", authMiddleware, getQuestionsByUser);

// Crear pregunta a un producto
router.post("/products/:productId/questions", authMiddleware, createQuestion);

// Obtener preguntas de un producto
router.get("/products/:productId/question", getQuestionsByProduct);

// ================================
// VENDEDOR / ADMIN
// ================================

// Responder una pregunta
router.put("/questions/:id/answer", authMiddleware, answerQuestion);

// ================================
// ADMIN / OWNER
// ================================

// Eliminar pregunta
router.delete("/questions/:id", authMiddleware, deleteQuestion);
router.get(
  "/seller/questions",
  authMiddleware,
  getQuestionsForSeller
);


module.exports = router;
