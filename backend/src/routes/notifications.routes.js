import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { sendPushNotification, getMyNotifications, markAsRead } from '../controllers/notifications.controller.js';

const router = express.Router();

// Admin can send notifications
router.post('/send', protect, authorize('admin'), sendPushNotification);

// Users/Therapists fetch their notifications
router.get('/my', protect, getMyNotifications);
router.patch('/:id/read', protect, markAsRead);

export default router;
