import mongoose from 'mongoose';

const emergencyContactSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    trim: true,
  },
  icon: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    required: true,
  },
  desc: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true
});

export default mongoose.model('EmergencyContact', emergencyContactSchema);
