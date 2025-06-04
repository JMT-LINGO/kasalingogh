import { Router } from 'express';
import {
    createLesson,
    getAllLessons,
    getLessonById,
    getLessonsByLanguage,
    updateLesson,
    patchLesson,
    deleteLesson,
    deleteLessons,
    getLessonsStats
} from '../controllers/lessonsController.js'; // Adjust path as needed
import { verifyAdmin } from '../middlewares/auth.js';

const lessonsRouter = Router();

// CREATE Routes
lessonsRouter.post('/lesson',verifyAdmin, createLesson);

// READ Routes
lessonsRouter.get('/lesson/fetch', getAllLessons);
lessonsRouter.get('/lesson/stats', getLessonsStats);
lessonsRouter.get('/lesson/language/:language', getLessonsByLanguage);
lessonsRouter.get('/lesson/:id', getLessonById);

// UPDATE Routes
lessonsRouter.put('/lesson/:id',verifyAdmin, updateLesson);        // Full update
lessonsRouter.patch('/lesson/:id', verifyAdmin, patchLesson);       // Partial update

// DELETE Routes
lessonsRouter.delete('/lesson/bulk', verifyAdmin, deleteLessons);   // Delete multiple lessons
lessonsRouter.delete('/lesson/:id', verifyAdmin, deleteLesson);     // Delete single lesson

export default lessonsRouter;

