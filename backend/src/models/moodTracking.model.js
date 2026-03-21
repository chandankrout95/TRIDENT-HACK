import mongoose from 'mongoose';

const moodTrackingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mood: { type: String, required: true },
  score: { type: Number, required: true },
}, { timestamps: true });

export default mongoose.model('MoodTracking', moodTrackingSchema);
