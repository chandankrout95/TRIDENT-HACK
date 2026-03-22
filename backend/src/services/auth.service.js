import User from '../models/auth.model.js';
import OTP from '../models/otp.model.js';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

// ── Token Generation ─────────────────────────────────────────────────────────
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d',
  });
};

// ── Nodemailer Transporter ───────────────────────────────────────────────────
const getTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// ── Register User (creates temp record via OTP) ──────────────────────────────
const registerUser = async (payload) => {
  const { email } = payload;
  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new Error('User already exists');
  }

  // Send OTP for email verification and store payload
  await sendOTP(email, payload);

  return { email, role: payload.role };
};

// ── Send OTP ─────────────────────────────────────────────────────────────────
const sendOTP = async (email, payload = null) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Remove any existing OTPs for this email
  await OTP.deleteMany({ email });

  const createData = {
    email,
    otp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  };
  if (payload) {
    createData.payload = payload;
  }

  // Create new OTP with 10-minute expiry
  await OTP.create(createData);

  const transporter = getTransporter();

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your Verification OTP - Trident Mental Health',
    text: `Your OTP for email verification is: ${otp}. It will expire in 10 minutes.`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px;">
        <div style="background: white; border-radius: 12px; padding: 32px; text-align: center;">
          <h2 style="color: #1a1a2e; margin-bottom: 8px;">Welcome to Trident</h2>
          <p style="color: #6b7280; margin-bottom: 24px;">Your one-time verification code</p>
          <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4f46e5;">${otp}</span>
          </div>
          <p style="color: #9ca3af; font-size: 13px;">This code expires in 10 minutes.</p>
        </div>
      </div>
    `,
  });

  return true;
};

// ── Verify OTP ───────────────────────────────────────────────────────────────
const verifyOTP = async (email, otp) => {
  const otpRecord = await OTP.findOne({ email, otp });

  if (!otpRecord) {
    throw new Error('Invalid OTP');
  }

  if (otpRecord.expiresAt < new Date()) {
    await OTP.deleteMany({ email });
    throw new Error('OTP has expired');
  }

  let user = await User.findOne({ email });

  if (!user && otpRecord.payload) {
    // Create actual user document now that email is verified
    user = await User.create({
      ...otpRecord.payload,
      isVerified: true,
      isProfileComplete: false,
    });
  } else if (user) {
    // Just verify the existing user
    user.isVerified = true;
    await user.save();
  } else {
    throw new Error('User not found and no registration data available.');
  }

  // Clean up OTP
  await OTP.deleteMany({ email });

  return {
    token: generateToken(user._id, user.role),
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      isProfileComplete: user.isProfileComplete,
    },
  };
};

// ── Resend OTP (Handles pending registration vs active user) ─────────────────
const resendOTP = async (email) => {
  const user = await User.findOne({ email });
  if (user && user.isVerified) {
    throw new Error('Email is already verified');
  }

  const oldOtp = await OTP.findOne({ email }).sort({ createdAt: -1 });
  let payload = oldOtp ? oldOtp.payload : null;

  if (!user && !payload) {
    throw new Error('Registration expired. Please register again.');
  }

  await sendOTP(email, payload);
};

// ── Login User (email + password only) ───────────────────────────────────────
const loginUser = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  if (!user.isVerified) {
    throw new Error('Please verify your email first');
  }

  if (user.isBlocked) {
    throw new Error('Your account has been suspended');
  }

  return {
    token: generateToken(user._id, user.role),
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      isVerified: user.isVerified,
      isProfileComplete: user.isProfileComplete,
    },
  };
};

export { generateToken, registerUser, sendOTP, verifyOTP, loginUser, resendOTP };
