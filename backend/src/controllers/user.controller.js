import User from '../models/auth.model.js';
import TherapistProfile from '../models/therapists.model.js';
import Session from '../models/sessions.model.js';
import MoodTracking from '../models/moodTracking.model.js';
import Exercise from '../models/exercises.model.js';

export const getApprovedTherapists = async (req, res, next) => {
  try {
    const therapists = await TherapistProfile.find({ isApproved: true }).populate('user', 'name email');
    res.json(therapists);
  } catch (error) { next(error); }
};

export const bookSession = async (req, res, next) => {
  try {
    const { therapistId, date, timeSlot } = req.body;
    const session = await Session.create({
      user: req.user._id,
      therapist: therapistId,
      date,
      timeSlot,
      status: 'pending'
    });
    res.status(201).json(session);
  } catch (error) { next(error); }
};

export const getUserSessions = async (req, res, next) => {
  try {
    const sessions = await Session.find({ user: req.user._id }).populate('therapist');
    res.json(sessions);
  } catch (error) { next(error); }
};

export const logUserMood = async (req, res, next) => {
  try {
    const { mood, score } = req.body;
    const log = await MoodTracking.create({ user: req.user._id, mood, score });
    res.status(201).json(log);
  } catch (error) { next(error); }
};

export const getUserExercises = async (req, res, next) => {
  try {
    const exercises = await Exercise.find({});
    res.json(exercises);
  } catch (error) { next(error); }
};
