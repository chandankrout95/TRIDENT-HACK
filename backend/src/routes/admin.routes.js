import express from 'express';
import { 
  getUsers, blockUser, 
  getPendingTherapists, approveTherapist, rejectTherapist,
  sendNotification, getReports
} from '../controllers/admin.controller.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/users', getUsers);
router.patch('/users/:id/block', blockUser);
router.get('/therapists/pending', getPendingTherapists);
router.patch('/therapists/:id/approve', approveTherapist);
router.delete('/therapists/:id/reject', rejectTherapist);
router.post('/notifications', sendNotification);
router.get('/reports', getReports);

export default router;
