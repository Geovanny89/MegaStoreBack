const express = require("express");
const router = express.Router();
const auth = require("../../middleware/sesion");
const {
  createQuestion,
  answerQuestion,
  getQuestionsByProduct,
  getQuestionsByUser,
//   getQuestionsForSeller,
  deleteQuestion
} = require("../../controller/Questions/productQuestionController");


// Preguntar (user)
router.post("/:productId/questions", auth, createQuestion);

// Responder (seller o admin)
router.post("/questions/:id/answer", auth,  answerQuestion);

// Obtener preguntas de un producto
router.get("/:productId/questions", getQuestionsByProduct);

// Preguntas hechas por el usuario
router.get("/questions/user/me", auth, getQuestionsByUser);

// Preguntas recibidas por un vendedor
// router.get("/questions/seller/me", auth, getQuestionsForSeller);

// Eliminar pregunta
router.delete("/questions/:id", auth, deleteQuestion);

module.exports = router;
