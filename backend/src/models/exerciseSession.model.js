import mongoose from 'mongoose';

const exerciseSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise', required: true },
  exerciseTitle: { type: String, required: true },
  exerciseType: { type: String, required: true },
  durationSeconds: { type: Number, required: true },
  pointsEarned: { type: Number, default: 0 },
  completedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Compound index for fast user+date queries
exerciseSessionSchema.index({ userId: 1, completedAt: -1 });

export default mongoose.model('ExerciseSession', exerciseSessionSchema);
