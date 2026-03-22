import mongoose from 'mongoose';

const dailyGoalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for faster queries on user and date
dailyGoalSchema.index({ user: 1, date: -1 });

export default mongoose.model('DailyGoal', dailyGoalSchema);
