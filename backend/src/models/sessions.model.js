import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  therapist: { type: mongoose.Schema.Types.ObjectId, ref: 'TherapistProfile', required: true },
  date: { type: Date, required: true },
  timeSlot: { type: String, required: true }, // '09:00 AM - 10:00 AM'
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
  notes: { type: String }
}, { timestamps: true });

export default mongoose.model('Session', sessionSchema);
