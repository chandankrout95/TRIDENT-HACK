import mongoose from 'mongoose';

const moodTrackingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  mood: { type: String, required: true, enum: ['terrible', 'bad', 'okay', 'good', 'great'] },
  score: { type: Number, required: true, min: 1, max: 5 },
  note: { type: String, default: '' },
  pointsEarned: { type: Number, default: 2 },
  context: { type: String, enum: ['manual', 'prompt', 'checkin'], default: 'manual' },
}, { timestamps: true });

// Compound index for fast user+date queries
moodTrackingSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('MoodTracking', moodTrackingSchema);
