import express from 'express';
import { getReports } from '../controllers/reports.controller.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, authorize('admin'), getReports);

export default router;
