import express from 'express';
import { getTherapistSessions, updateSessionStatus } from '../controllers/therapist.controller.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, authorize('therapist'));

router.get('/sessions', getTherapistSessions);
router.patch('/sessions/:id/status', updateSessionStatus);

export default router;
