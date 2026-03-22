import express from 'express';
import {
  getStats, getTherapists,
  getUsers, blockUser,
  getPendingTherapists, getTherapistDetail,
  approveTherapist, rejectTherapist,
  sendNotification, getReports,
  getEmergencyContacts, updateEmergencyContact
} from '../controllers/admin.controller.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/stats', getStats);
router.get('/users', getUsers);
router.patch('/users/:id/block', blockUser);
router.get('/therapists', getTherapists);
router.get('/therapist-requests', getPendingTherapists);
router.get('/therapist/:id', getTherapistDetail);
router.post('/approve/:id', approveTherapist);
router.post('/reject/:id', rejectTherapist);
router.post('/notifications', sendNotification);
router.get('/reports', getReports);

// Emergency Contacts Management
router.get('/emergency-contacts', getEmergencyContacts);
router.put('/emergency-contacts/:id', updateEmergencyContact);

export default router;
