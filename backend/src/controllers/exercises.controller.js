import Exercise from '../models/exercises.model.js';

export const getExercises = async (req, res) => {
  try {
    const exercises = await Exercise.find({});
    res.json(exercises);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching exercises' });
  }
};
