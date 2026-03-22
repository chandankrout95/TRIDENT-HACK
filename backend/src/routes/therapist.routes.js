import express from 'express';
import {
  submitPersonalInfo,
  uploadDocument,
  submitApplication,
  getApplicationStatus,
  getMyProfile,
  reapplyApplication,
  getMySessions,
  updateSessionStatus,
  completeSession,
} from '../controllers/therapist.controller.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { documentUpload } from '../config/cloudinary.js';

const router = express.Router();

// All routes require authentication and therapist role
router.use(protect, authorize('therapist'));

// Personal info
router.post('/personal-info', submitPersonalInfo);

// Document upload (single file)
router.post('/upload-document', documentUpload.single('document'), uploadDocument);

// Submit application for review
router.post('/submit-application', submitApplication);

// Get application status
router.get('/application-status', getApplicationStatus);

// Get full profile
router.get('/my-profile', getMyProfile);

// Reapply after rejection
router.post('/reapply', reapplyApplication);

// Get my sessions
router.get('/sessions', getMySessions);

// Update Session status (accept/reject)
router.put('/sessions/:id/status', updateSessionStatus);

// Complete Session (OTP required)
router.put('/sessions/:id/complete', completeSession);

export default router;
