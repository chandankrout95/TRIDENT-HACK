import MoodTracking from '../models/moodTracking.model.js';

export const logMood = async (req, res) => {
  try {
    const { mood, score } = req.body;
    const log = await MoodTracking.create({ user: req.user._id, mood, score });
    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ message: 'Error logging mood' });
  }
};
