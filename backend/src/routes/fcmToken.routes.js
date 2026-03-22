import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import User from '../models/auth.model.js';

const router = express.Router();

// Register or update an FCM token
router.post('/register', protect, async (req, res) => {
  try {
    const { token, appType } = req.body;
    
    if (!token || !appType) {
      return res.status(400).json({ message: 'Token and appType are required' });
    }

    const userId = req.user._id;

    // Check if the token already exists for this user
    const user = await User.findById(userId);
    const existingToken = user.fcmTokens.find(t => t.token === token);

    if (existingToken) {
      // Just update the timestamp
      existingToken.updatedAt = new Date();
    } else {
      // Add new token
      user.fcmTokens.push({ token, appType, updatedAt: new Date() });
    }

    await user.save();
    
    res.status(200).json({ message: 'FCM token registered successfully' });
  } catch (error) {
    console.error('FCM Registration Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove an FCM token (e.g., on logout)
router.post('/unregister', protect, async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { fcmTokens: { token } }
    });

    res.status(200).json({ message: 'FCM token unregistered successfully' });
  } catch (error) {
    console.error('FCM Unregistration Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
