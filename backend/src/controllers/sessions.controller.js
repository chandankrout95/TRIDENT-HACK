import Session from '../models/sessions.model.js';
import Transaction from '../models/transactions.model.js';
import TherapistProfile from '../models/therapists.model.js';
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
    
    const session = await Session.findById(id).populate('therapist');
    if (!session) return res.status(404).json({ message: 'Session not found' });

    const prevStatus = session.status;
    session.status = status;
    await session.save();

    // If marked as completed, create an earning transaction
    if (status === 'completed' && prevStatus !== 'completed') {
      const profile = await TherapistProfile.findById(session.therapist);
      const amount = profile?.hourlyRate || 500; // Fallback to 500 if not set

      await Transaction.create({
        therapist: profile.user, // Transactions linked to User ID
        amount,
        type: 'earning',
        status: 'completed',
        description: `Session completed - client: ${session.user}`,
      });
    }
    
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
