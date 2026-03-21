import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { getMyTransactions, getMyEarnings, requestWithdrawal } from '../controllers/transactions.controller.js';

const router = express.Router();

router.use(protect);
router.use(authorize('therapist')); // Only therapists have earnings/withdrawals for now

router.get('/my', getMyTransactions);
router.get('/earnings', getMyEarnings);
router.post('/withdraw', requestWithdrawal);

export default router;
