import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  email: { type: String, required: true, unique: true },
  phone: { type: String, default: '' },
  password: { type: String },
  role: { type: String, enum: ['user', 'therapist', 'admin'], default: 'user' },
  profileImage: { type: String, default: '' },

  // Extended profile fields
  fcmTokens: [{
    token: { type: String, required: true },
    appType: { type: String, enum: ['user', 'therapist'], required: true },
    updatedAt: { type: Date, default: Date.now }
  }],
  age: { type: Number },
  dob: { type: Date },
  hobby: { type: String, default: '' },
  occupation: { type: String, default: '' },
  gender: { type: String, enum: ['male', 'female', 'other', ''], default: '' },
  bio: { type: String, default: '' },
  vitals: {
    steps: { type: Number, default: 0 },
    heartRate: { type: Number, default: 0 },
    calories: { type: Number, default: 0 },
    sleep: { type: String, default: '0h 0m' },
    lastSynced: { type: Date }
  },

  // Wellness points & exercise tracking
  points: { type: Number, default: 0 },
  exerciseStreak: { type: Number, default: 0 },
  lastExerciseDate: { type: Date },

  // Verification & status
  isVerified: { type: Boolean, default: false },
  isProfileComplete: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },

  // Legacy OTP fields (kept for backward compat, prefer OTP model)
  otp: { type: String },
  otpExpires: { type: Date },
}, { timestamps: true });

userSchema.pre('save', async function() {
  if (!this.isModified('password') || !this.password) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);
