import Session from '../models/sessions.model.js';
import { getIO } from '../config/socket.js';

// Helper to find socket ID for a user
const getUserSocketId = (io, userId) => {
  // Access the users Map from socket config via a simple iteration
  // We'll use a socket event approach instead
  return null;
};

// User creates booking
const bookSession = async (req, res, next) => {
  try {
    const { therapist, date, timeSlot } = req.body;
    const session = await Session.create({
      user: req.user._id,
      therapist,
      date,
      timeSlot
    });

    // Emit real-time appointment notification to therapist via socket
    try {
      const io = getIO();
      const populatedSession = await Session.findById(session._id).populate('user', 'email');
      // Broadcast to all connected sockets — the client filters by therapist ID
      io.emit('new_appointment', populatedSession);
    } catch (socketErr) {
      console.error('Socket emit error (non-critical):', socketErr);
    }

    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
};

// User views their bookings
const getUserSessions = async (req, res, next) => {
  try {
    const sessions = await Session.find({ user: req.user._id }).populate('therapist', 'name specialization user');
    res.json(sessions);
  } catch (error) {
    next(error);
  }
};

// Therapist views their bookings
const getTherapistSessions = async (req, res, next) => {
  try {
    // Requires getting TherapistProfile ID for this user first. Mocked here:
    // const profile = await TherapistProfile.findOne({user: req.user._id});
    const { therapistId } = req.params; 
    const sessions = await Session.find({ therapist: therapistId }).populate('user', 'email');
    res.json(sessions);
  } catch (error) {
    next(error);
  }
};

// Therapist or Admin updates status
const updateSessionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const session = await Session.findByIdAndUpdate(id, { status }, { new: true });
    
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json(session);
  } catch (error) {
    next(error);
  }
};

// Admin views all sessions
const getAllSessionsAdmin = async (req, res, next) => {
  try {
    const sessions = await Session.find()
      .populate('user', 'email')
      .populate('therapist', 'name user');
    res.json(sessions);
  } catch (error) {
    next(error);
  }
};

export {  bookSession, getUserSessions, getTherapistSessions, updateSessionStatus, getAllSessionsAdmin  };
