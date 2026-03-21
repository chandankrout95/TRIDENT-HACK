import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { getAllTherapistsAdmin, approveTherapist, getApprovedTherapists, createOrUpdateProfile } from '../controllers/therapists.controller.js';

const router = express.Router();

// Admin routes
router.get('/admin', protect, authorize('admin'), getAllTherapistsAdmin);
router.patch('/admin/:id/approve', protect, authorize('admin'), approveTherapist);

// Therapist routes
router.post('/profile', protect, authorize('therapist'), createOrUpdateProfile);

// Public/User routes
router.get('/approved', protect, getApprovedTherapists);

export default router;
