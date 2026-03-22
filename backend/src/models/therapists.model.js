import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['medical_license', 'degree_certificate', 'government_id'],
    required: true,
  },
  url: { type: String, required: true },
  publicId: { type: String }, // Cloudinary public_id for deletion
  originalName: { type: String },
  uploadedAt: { type: Date, default: Date.now },
});

const therapistProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },

  // Professional info
  specialization: { type: String },
  qualification: { type: String, default: '' },
  experience: { type: String, default: '' },
  licenseNumber: { type: String, unique: true, sparse: true },
  bio: { type: String, default: '' },

  // Personal info
  age: { type: Number },
  dob: { type: Date },

  // Practice details
  hourlyRate: { type: Number, default: 50 },
  rating: { type: Number, default: 4.5, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  languages: [{ type: String }],
  profileImage: { type: String },

  // Verification
  documents: [documentSchema],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  rejectionNote: { type: String, default: '' },

  // Legacy field (kept for backward compat)
  isApproved: { type: Boolean, default: false },

  availability: [{
    day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
    slots: [{
      startTime: String,
      endTime: String,
    }],
  }],
}, { timestamps: true });

// Keep isApproved in sync with status
therapistProfileSchema.pre('save', function() {
  this.isApproved = this.status === 'approved';
});

export default mongoose.model('TherapistProfile', therapistProfileSchema);
