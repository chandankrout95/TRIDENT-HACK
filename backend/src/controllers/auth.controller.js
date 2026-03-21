import * as authService from '../services/auth.service.js';
import { registerSchema, loginSchema } from '../validations/auth.validation.js';
import User from '../models/auth.model.js';

const register = async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    
    const user = await authService.registerUser(value);
    res.status(201).json({
      _id: user._id,
      email: user.email,
      role: user.role,
      token: authService.generateToken(user._id, user.role)
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const user = await User.findOne({ email: value.email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    if (value.password) {
      const isMatch = await user.matchPassword(value.password);
      if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
      return res.json({
        _id: user._id,
        email: user.email,
        role: user.role,
        token: authService.generateToken(user._id, user.role)
      });
    } else {
      await authService.sendOTP(value.email);
      res.json({ message: 'OTP sent to email' });
    }
  } catch (err) {
    next(err);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' });
    
    const token = await authService.verifyOTP(email, otp);
    res.json({ token, message: 'OTP verified successfully' });
  } catch (err) {
    next(err);
  }
};

// Get user profile
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// Update user profile
const updateProfile = async (req, res, next) => {
  try {
    const { email, phone, profileImage } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (profileImage !== undefined) user.profileImage = profileImage;

    // Remove the generic 'name' property from auth schema logic as the auth schema doesn't have a specific name string.
    // Wait, the auth schema just has email, password, role, isVerified, phone, profileImage, otp. 
    // Usually name might be stored alongside email. For this app, let's just save email, phone, profileImage.

    await user.save();

    res.json({
      _id: user._id,
      email: user.email,
      role: user.role,
      phone: user.phone,
      profileImage: user.profileImage,
      token: req.headers.authorization.split(' ')[1] // return same token
    });
  } catch (error) {
    next(error);
  }
};

export { register, login, verifyOtp, getMe, updateProfile };
