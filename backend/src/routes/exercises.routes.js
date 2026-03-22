import express from 'express';
import {
  getExercises,
  completeExercise,
  getExerciseHistory,
  getExerciseStats,
} from '../controllers/exercises.controller.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getExercises);
router.post('/complete', completeExercise);
router.get('/history', getExerciseHistory);
router.get('/stats', getExerciseStats);

export default router;
