import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { generateAgoraToken } from '../controllers/agora.controller.js';

const router = express.Router();

// Authenticated users can request a token to join an Agora channel
router.post('/token', protect, generateAgoraToken);

export default router;
