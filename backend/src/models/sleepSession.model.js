import mongoose from 'mongoose';

const sleepSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  mood: {
    type: String,
    enum: ['stressed', 'anxious', 'tired', 'neutral', 'calm'],
    required: true,
  },
  sleepGoal: {
    type: String,
    enum: ['fall_asleep', 'deep_sleep', 'power_nap', 'relax'],
    required: true,
  },
  soundPreference: {
    type: String,
    enum: ['rain', 'forest', 'ocean', 'wind', 'brown_noise', 'pink_noise'],
    default: 'rain',
  },
  frequencies: {
    baseFrequency: { type: Number, default: 200 },
    binauralOffset: { type: Number, default: 3 },
    recommendedDuration: { type: Number, default: 30 },
  },
  aiTip: { type: String },
  durationMinutes: { type: Number, required: true },
  completed: { type: Boolean, default: false },
}, { timestamps: true });

sleepSessionSchema.index({ userId: 1, createdAt: -1 });

const SleepSession = mongoose.model('SleepSession', sleepSessionSchema);
export default SleepSession;
