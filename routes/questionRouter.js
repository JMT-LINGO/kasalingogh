import { Router } from "express";
import {
  createQuestion,
  getQuestions,
  getQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestionsByLanguage,
  getQuestionsByDifficulty,
  getQuestionsByCategory
} from '../controllers/questionController.js';

const questionRouter = Router()



questionRouter
  .route('/')
  .get(getQuestions)
  .post(createQuestion);

questionRouter
  .route('/:id')
  .get(getQuestion)
  .put(updateQuestion)
  .delete(deleteQuestion);

questionRouter.get('/language/:language', getQuestionsByLanguage);
questionRouter.get('/difficulty/:level', getQuestionsByDifficulty);
questionRouter.get('/category/:category', getQuestionsByCategory);

export default questionRouter;