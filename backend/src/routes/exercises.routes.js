import express from 'express';
import { getExercises } from '../controllers/exercises.controller.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getExercises);

export default router;
