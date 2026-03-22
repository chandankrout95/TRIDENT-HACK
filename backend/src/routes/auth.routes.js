import express from 'express';
import { register, login, verifyOtp, resendOtp, getMe, updateUserInfo, updateProfile } from '../controllers/auth.controller.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.get('/me', protect, getMe);
router.put('/user-info', protect, updateUserInfo);
router.put('/profile', protect, updateProfile);

export default router;
