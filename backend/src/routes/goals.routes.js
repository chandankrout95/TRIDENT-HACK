import express from 'express';
import { getTodayGoals, createGoal, toggleGoal, deleteGoal } from '../controllers/goals.controller.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All goal routes are protected

router.get('/', getTodayGoals);
router.post('/', createGoal);
router.patch('/:id/toggle', toggleGoal);
router.delete('/:id', deleteGoal);

export default router;
