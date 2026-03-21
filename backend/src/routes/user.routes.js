import express from 'express';
import { 
  getApprovedTherapists, bookSession, getUserSessions,
  logUserMood, getUserExercises
} from '../controllers/user.controller.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, authorize('user'));

router.get('/therapists', getApprovedTherapists);
router.post('/sessions', bookSession);
router.get('/sessions', getUserSessions);
router.post('/mood', logUserMood);
router.get('/exercises', getUserExercises);

export default router;
