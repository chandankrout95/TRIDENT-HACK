import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getConversations, getChatHistory, markMessagesAsRead } from '../controllers/chat.controller.js';

const router = express.Router();

router.get('/conversations', protect, getConversations);
router.get('/:userId', protect, getChatHistory);
router.patch('/read', protect, markMessagesAsRead);

export default router;
