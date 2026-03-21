import express from 'express';
import { logMood } from '../controllers/moodTracking.controller.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, logMood);

export default router;
