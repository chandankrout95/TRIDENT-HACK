import express from 'express';
import { logMood, getTodayMoods, getMoodHistory } from '../controllers/moodTracking.controller.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', logMood);
router.get('/today', getTodayMoods);
router.get('/history', getMoodHistory);

export default router;
