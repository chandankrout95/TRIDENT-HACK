import Exercise from '../models/exercises.model.js';
import ExerciseSession from '../models/exerciseSession.model.js';
import User from '../models/auth.model.js';

// GET /exercises — list all exercises
export const getExercises = async (req, res) => {
  try {
    const exercises = await Exercise.find({});
    res.json(exercises);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching exercises' });
  }
};

// POST /exercises/complete — mark an exercise as done, award points
export const completeExercise = async (req, res) => {
  try {
    const { exerciseId, durationSeconds } = req.body;
    const userId = req.user._id;

    const exercise = await Exercise.findById(exerciseId);
    if (!exercise) {
      return res.status(404).json({ message: 'Exercise not found' });
    }

    // Points calculation: 10 base + 5 bonus if user completed full duration
    const targetSeconds = parseInt(exercise.duration) * 60 || 300;
    const completedFull = durationSeconds >= targetSeconds * 0.9; // 90% threshold
    const pointsEarned = completedFull ? 15 : 10;

    // Create session record
    const session = await ExerciseSession.create({
      userId,
      exerciseId,
      exerciseTitle: exercise.title,
      exerciseType: exercise.type,
      durationSeconds,
      pointsEarned,
      completedAt: new Date(),
    });

    // Update user points & streak
    const user = await User.findById(userId);
    user.points = (user.points || 0) + pointsEarned;

    // Streak logic: if last exercise was yesterday, increment; if today, keep; otherwise reset to 1
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (user.lastExerciseDate) {
      const lastDate = new Date(user.lastExerciseDate);
      const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());

      if (lastDay.getTime() === yesterday.getTime()) {
        user.exerciseStreak = (user.exerciseStreak || 0) + 1;
      } else if (lastDay.getTime() === today.getTime()) {
        // Already exercised today, streak stays the same
      } else {
        user.exerciseStreak = 1;
      }
    } else {
      user.exerciseStreak = 1;
    }

    user.lastExerciseDate = now;
    await user.save();

    res.json({
      message: 'Exercise completed!',
      session,
      pointsEarned,
      totalPoints: user.points,
      streak: user.exerciseStreak,
    });
  } catch (err) {
    console.error('Complete exercise error:', err);
    res.status(500).json({ message: 'Error completing exercise' });
  }
};

// GET /exercises/history — get user's completed sessions
export const getExerciseHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const sessions = await ExerciseSession.find({ userId })
      .sort({ completedAt: -1 })
      .limit(50)
      .lean();

    res.json(sessions);
  } catch (err) {
    console.error('Exercise history error:', err);
    res.status(500).json({ message: 'Error fetching exercise history' });
  }
};

// GET /exercises/stats — get today's progress, streak, and points
export const getExerciseStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Count today's completed sessions
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const completedToday = await ExerciseSession.countDocuments({
      userId,
      completedAt: { $gte: startOfDay, $lt: endOfDay },
    });

    const totalExercises = await Exercise.countDocuments();

    const user = await User.findById(userId).select('points exerciseStreak').lean();

    res.json({
      completedToday,
      totalExercises,
      streak: user?.exerciseStreak || 0,
      totalPoints: user?.points || 0,
    });
  } catch (err) {
    console.error('Exercise stats error:', err);
    res.status(500).json({ message: 'Error fetching exercise stats' });
  }
};
