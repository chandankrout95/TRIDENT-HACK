import mongoose from 'mongoose';

const therapistProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  specialization: { type: String },
  licenseNumber: { type: String, required: true, unique: true },
  bio: { type: String },
  hourlyRate: { type: Number, default: 50 },
  rating: { type: Number, default: 4.5, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  yearsExperience: { type: Number, default: 1 },
  languages: [{ type: String }],
  profileImage: { type: String },
  isApproved: { type: Boolean, default: false },
  availability: [{
    day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
    slots: [{
      startTime: String, // '09:00 AM'
      endTime: String    // '10:00 AM'
    }]
  }]
}, { timestamps: true });

export default mongoose.model('TherapistProfile', therapistProfileSchema);
