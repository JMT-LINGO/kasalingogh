import { Router } from "express";

import {
  createQuestion,
  getAllQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  getQuestionsByLanguage,
  getQuestionsByDifficulty,
  getQuestionsByCategory,
  getQuestionStats,
  
} from '../controllers/questionController.js';
import { verifyAdmin } from "../middlewares/auth.js";



const questionRouter = Router()


// Public routes (no authentication required)
// Get all questions with filtering, sorting, and pagination
questionRouter.get('/', getAllQuestions);

// Get single question by ID
questionRouter.get('/:id', getQuestionById);

// Get questions by language
questionRouter.get('/language/:language', getQuestionsByLanguage);

// Get questions by difficulty level
questionRouter.get('/difficulty/:difficulty', getQuestionsByDifficulty);

// Get questions by category
questionRouter.get('/category/:category', getQuestionsByCategory);

// Get question statistics
questionRouter.get('/stats/overview', getQuestionStats);

// Admin only routes (authentication required)
// Create new question
questionRouter.post('/', verifyAdmin, createQuestion);

// Update question
questionRouter.put('/:id', verifyAdmin, updateQuestion);

// Delete question
questionRouter.delete('/:id', verifyAdmin, deleteQuestion);







export default questionRouter;





