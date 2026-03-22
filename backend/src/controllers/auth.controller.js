import * as authService from '../services/auth.service.js';
import { registerSchema, loginSchema, verifyOtpSchema, userInfoSchema } from '../validations/auth.validation.js';
import User from '../models/auth.model.js';
import TherapistProfile from '../models/therapists.model.js';
import Session from '../models/sessions.model.js';

// ── Register ─────────────────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const result = await authService.registerUser(value);
    res.status(201).json({
      message: 'Registration successful. OTP sent to your email.',
      email: result.email,
      role: result.role,
    });
  } catch (err) {
    if (err.message === 'User already exists') {
      return res.status(409).json({ message: err.message });
    }
    next(err);
  }
};

// ── Login (email + password only) ────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const result = await authService.loginUser(value.email, value.password);

    // For therapist role, also fetch therapist profile status
    if (result.user.role === 'therapist') {
      const therapistProfile = await TherapistProfile.findOne({ user: result.user._id });
      result.user.therapistProfile = therapistProfile ? {
        ...therapistProfile.toObject(),
        isProfileComplete: result.user.isProfileComplete,
        hasDocuments: therapistProfile.documents?.length >= 3,
      } : null;
    }

    res.json(result);
  } catch (err) {
    if (err.message === 'Invalid credentials') {
      return res.status(401).json({ message: err.message });
    }
    if (err.message === 'Please verify your email first') {
      return res.status(403).json({ message: err.message, needsVerification: true });
    }
    if (err.message === 'Your account has been suspended') {
      return res.status(403).json({ message: err.message });
    }
    next(err);
  }
};

// ── Verify OTP ───────────────────────────────────────────────────────────────
const verifyOtp = async (req, res, next) => {
  try {
    const { error, value } = verifyOtpSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const result = await authService.verifyOTP(value.email, value.otp);
    res.json({
      message: 'Email verified successfully',
      ...result,
    });
  } catch (err) {
    if (err.message === 'Invalid OTP' || err.message === 'OTP has expired') {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
};

// ── Resend OTP ───────────────────────────────────────────────────────────────
const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    await authService.resendOTP(email);
    res.json({ message: 'OTP resent successfully' });
  } catch (err) {
    if (err.message === 'Email is already verified' || err.message === 'Registration expired. Please register again.') {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
};

// ── Get Me (user profile) ────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password -otp -otpExpires');

    if (user.role === 'therapist') {
      const therapistProfile = await TherapistProfile.findOne({ user: user._id });
      if (therapistProfile) {
        const allSessions = await Session.find({ therapist: therapistProfile._id });
        const completedSessions = allSessions.filter(s => s.status === 'completed');
        const uniqueClients = new Set(allSessions.map(s => s.user.toString())).size;
        const displayRating = therapistProfile.reviewCount > 0 ? therapistProfile.rating : 0;

        return res.json({
          ...user.toObject(),
          therapistProfile: {
            ...therapistProfile.toObject(),
            isProfileComplete: user.isProfileComplete,
            hasDocuments: therapistProfile.documents?.length >= 3,
            clientsCount: uniqueClients || 0,
            completedCount: completedSessions.length || 0,
            rating: displayRating
          },
        });
      }
      return res.json(user);
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

// ── Update User Info (post-registration profile completion) ──────────────────
const updateUserInfo = async (req, res, next) => {
  try {
    const { error, value } = userInfoSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Update provided fields
    Object.keys(value).forEach(key => {
      if (value[key] !== undefined) {
        user[key] = value[key];
      }
    });

    user.isProfileComplete = true;
    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        age: user.age,
        dob: user.dob,
        hobby: user.hobby,
        occupation: user.occupation,
        gender: user.gender,
        bio: user.bio,
        isVerified: user.isVerified,
        isProfileComplete: user.isProfileComplete,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── Update Profile (general purpose) ─────────────────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const { email, phone, profileImage, name } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (name) user.name = name;
    if (profileImage !== undefined) user.profileImage = profileImage;

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      profileImage: user.profileImage,
      token: req.headers.authorization.split(' ')[1],
    });
  } catch (error) {
    next(error);
  }
};

export { register, login, verifyOtp, resendOtp, getMe, updateUserInfo, updateProfile };
