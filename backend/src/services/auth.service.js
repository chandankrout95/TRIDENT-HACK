import User from '../models/auth.model.js';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d',
  });
};

const registerUser = async ({ email, password, role }) => {
  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new Error('User already exists');
  }
  const user = await User.create({ email, password, role });
  return user;
};

const sendOTP = async (email) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const user = await User.findOne({ email });
  if (!user) throw new Error('User not found');

  user.otp = otp;
  user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 mins
  await user.save();
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your Login OTP - Trident Mental Health',
    text: `Your OTP for login is: ${otp}. It will expire in 10 minutes.`,
    html: `<h3>Welcome to Trident Platform</h3><p>Your one-time password (OTP) is: <b>${otp}</b></p><p>This code will expire in 10 minutes.</p>`
  });

  return true;
};

const verifyOTP = async (email, otp) => {
  const user = await User.findOne({ email });
  if (!user || user.otp !== otp || user.otpExpires < Date.now()) {
    throw new Error('Invalid or expired OTP');
  }
  user.otp = undefined;
  user.otpExpires = undefined;
  user.isVerified = true;
  await user.save();
  return generateToken(user._id, user.role);
};

export {  generateToken, registerUser, sendOTP, verifyOTP  };
