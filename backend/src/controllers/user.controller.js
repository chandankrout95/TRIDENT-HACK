import User from '../models/auth.model.js';
import TherapistProfile from '../models/therapists.model.js';
import EmergencyContact from '../models/emergency.model.js';
import Session from '../models/sessions.model.js';
import MoodTracking from '../models/moodTracking.model.js';
import Exercise from '../models/exercises.model.js';
import { getIO } from '../config/socket.js';
import { sendPushNotification } from '../services/pushNotification.service.js';

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

    try {
      const io = getIO();
      const populatedSession = await Session.findById(session._id).populate('user', 'name email');
      io.emit('new_appointment', populatedSession.toObject ? populatedSession.toObject() : populatedSession);
      
      
      // Notify Therapist via Push (We need the User ID, not TherapistProfile ID)
      const userName = req.user.name || req.user.email.split('@')[0];
      const therapistProfile = await TherapistProfile.findById(therapistId);
      if (therapistProfile && therapistProfile.user) {
        sendPushNotification(therapistProfile.user, 'New Appointment', `${userName} just requested a new session`, {
          type: 'session',
          sessionId: session._id.toString()
        });
      }
    } catch (socketErr) {
      console.error('Socket emit error:', socketErr);
    }

    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all active emergency contacts
// @route   GET /api/user/emergency-contacts
// @access  Public (or Private if token enforced, currently Private via protect middleware)
export const getEmergencyContacts = async (req, res) => {
  try {
    const contacts = await EmergencyContact.find({ isActive: true }).sort({ createdAt: 1 });
    res.status(200).json(contacts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching emergency contacts', error: error.message });
  }
};

export const getUserSessions = async (req, res, next) => {
  try {
    const sessions = await Session.find({ user: req.user._id }).populate('therapist');
    res.json(sessions);
  } catch (error) { next(error); }
};

export const logUserMood = async (req, res, next) => {
  try {
    const { mood, score, note, context } = req.body;
    const pointsEarned = 2;
    const log = await MoodTracking.create({
      user: req.user._id,
      mood,
      score,
      note: note || '',
      pointsEarned,
      context: context || 'manual',
    });
    // Award points
    await User.findByIdAndUpdate(req.user._id, { $inc: { points: pointsEarned } });
    res.status(201).json(log);
  } catch (error) { next(error); }
};

export const getUserExercises = async (req, res, next) => {
  try {
    const exercises = await Exercise.find({});
    res.json(exercises);
  } catch (error) { next(error); }
};
