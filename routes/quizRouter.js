import { Router } from "express";
import {
  createQuiz,
  getQuizzes,
  getQuiz,
  updateQuiz,
  deleteQuiz,
  addQuestionToQuiz,
  removeQuestionFromQuiz,
  getQuizzesByLanguage,
  getQuizzesByDifficulty,
  getActiveQuizzes
} from '../controllers/quizController.js';

const quizRouter = Router()



// Base routes
quizRouter
  .route('/')
  .get(getQuizzes)
  .post(createQuiz);

quizRouter
  .route('/:id')
  .get(getQuiz)
  .put(updateQuiz)
  .delete(deleteQuiz);

// Question management routes
quizRouter
  .route('/:id/questions')
  .post(addQuestionToQuiz);

quizRouter
  .route('/:id/questions/:questionId')
  .delete(removeQuestionFromQuiz);

  export default quizRouter;