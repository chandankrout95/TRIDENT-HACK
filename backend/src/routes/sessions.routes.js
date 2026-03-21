import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { bookSession, 
  getUserSessions, 
  getTherapistSessions, 
  updateSessionStatus, 
  getAllSessionsAdmin } from '../controllers/sessions.controller.js';

const router = express.Router();

// User Routes
router.post('/book', protect, authorize('user'), bookSession);
router.get('/my-sessions', protect, authorize('user'), getUserSessions);

// Therapist Routes
router.get('/therapist/:therapistId', protect, authorize('therapist'), getTherapistSessions);
router.patch('/:id/status', protect, authorize('therapist', 'admin'), updateSessionStatus);

// Admin Routes
router.get('/admin/all', protect, authorize('admin'), getAllSessionsAdmin);

export default router;
