import { Router } from 'express';
import {
  createQuiz,
  getAllQuizzes,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  toggleQuizStatus,
  getQuizStats
} from '../controllers/quizController.js';
import { verifyAdmin } from '../middlewares/auth.js';

const quizRouter = Router();




quizRouter.use('/', (req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

quizRouter.post('/', verifyAdmin, createQuiz);                  // POST /api/quizzes - Create new quiz
quizRouter.get('/admin/stats', verifyAdmin, getQuizStats);      // GET /api/quizzes/admin/stats - Get quiz statistics

// Public routes (no authentication required)
quizRouter.get('/fetch', getAllQuizzes);                             // GET /api/quizzes - Get all quizzes with filtering

// Parameterized routes MUST come last
quizRouter.get('/:id', getQuizById);                            // GET /api/quizzes/:id - Get single quiz
quizRouter.put('/:id', verifyAdmin, updateQuiz);               // PUT /api/quizzes/:id - Update quiz
quizRouter.delete('/:id', verifyAdmin, deleteQuiz);            // DELETE /api/quizzes/:id - Delete quiz
quizRouter.patch('/:id/toggle', verifyAdmin, toggleQuizStatus); // PATCH /api/quizzes/:id/toggle - Toggle active status

export default quizRouter;




