import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  otp: { type: String, required: true },
  payload: { type: Object }, // Store temp user details here
  expiresAt: { type: Date, required: true, index: { expires: 0 } }, // TTL index — auto-delete when expired
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('OTP', otpSchema);
