import express from 'express';

// Dummy router for users mapping to Auth model
import User from '../models/auth.model.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/admin', protect, authorize('admin'), async (req, res, next) => {
  try {
    const users = await User.find({ role: 'user' }).select('-password');
    res.json(users);
  } catch (error) {
    next(error);
  }
});

router.patch('/admin/:id/block', protect, authorize('admin'), async (req, res, next) => {
  try {
    // In a real scenario, we add an `isBlocked` flag to the user schema
    // await User.findByIdAndUpdate(req.params.id, { isBlocked: req.body.block });
    res.json({ message: "User block status updated (mocked)" });
  } catch (error) {
    next(error);
  }
});

export default router;
