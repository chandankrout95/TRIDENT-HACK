import User from '../models/auth.model.js';
import TherapistProfile from '../models/therapists.model.js';
import Notification from '../models/notifications.model.js';
import Report from '../models/reports.model.js';
import Session from '../models/sessions.model.js';
import EmergencyContact from '../models/emergency.model.js';
import { rejectTherapistSchema } from '../validations/therapist.validation.js';
import { getIO } from '../config/socket.js';

// ── Dashboard Stats ──────────────────────────────────────────────────────────
export const getStats = async (req, res, next) => {
  try {
    const totalPatients = await User.countDocuments({ role: 'user' });
    const verifiedTherapists = await TherapistProfile.countDocuments({ status: 'approved' });
    const pendingApplications = await TherapistProfile.countDocuments({ status: 'pending' });

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const sessionsToday = await Session.countDocuments({ date: { $gte: start, $lte: end } });

    res.json({
      totalPatients,
      verifiedTherapists,
      pendingApplications,
      sessionsToday,
      serverHealth: '99.9%',
      securityAlerts: '0 Issues',
    });
  } catch (error) { next(error); }
};

// ── Get All Approved Therapists ──────────────────────────────────────────────
export const getTherapists = async (req, res, next) => {
  try {
    const therapists = await TherapistProfile.find({ status: 'approved' })
      .populate('user', 'email isBlocked name phone');
    res.json(therapists);
  } catch (error) { next(error); }
};

// ── Get All Users ────────────────────────────────────────────────────────────
export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } }).select('-password -otp -otpExpires');
    res.json(users);
  } catch (error) { next(error); }
};

// ── Block/Unblock User ───────────────────────────────────────────────────────
export const blockUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json(user);
  } catch (error) { next(error); }
};

// ── Emergency Contacts Management ────────────────────────────────────────────
export const getEmergencyContacts = async (req, res, next) => {
  try {
    const contacts = await EmergencyContact.find().sort({ createdAt: 1 });
    res.json(contacts);
  } catch (error) { next(error); }
};

export const updateEmergencyContact = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, icon, color, desc, phoneNumber, isActive } = req.body;
    
    const contact = await EmergencyContact.findByIdAndUpdate(
      id,
      { role, icon, color, desc, phoneNumber, isActive },
      { new: true, runValidators: true }
    );
    
    if (!contact) return res.status(404).json({ message: 'Emergency contact not found' });
    
    // Broadcast the updated contact list to all connected clients in real-time
    try {
      const allContacts = await EmergencyContact.find({ isActive: true }).sort({ createdAt: 1 });
      getIO().emit('emergency_contacts_updated', allContacts);
    } catch (socketErr) {
      console.error('Socket emission failed:', socketErr);
    }
    
    res.json(contact);
  } catch (error) { next(error); }
};

// ── Get Pending Therapist Applications ───────────────────────────────────────
export const getPendingTherapists = async (req, res, next) => {
  try {
    const pending = await TherapistProfile.find({ status: 'pending' })
      .populate('user', 'email name phone');
    res.json(pending);
  } catch (error) { next(error); }
};

// ── Get Therapist Detail (with documents) ────────────────────────────────────
export const getTherapistDetail = async (req, res, next) => {
  try {
    const profile = await TherapistProfile.findById(req.params.id)
      .populate('user', 'email name phone profileImage isBlocked isVerified');
    if (!profile) return res.status(404).json({ message: 'Therapist profile not found' });
    res.json(profile);
  } catch (error) { next(error); }
};

// ── Approve Therapist ────────────────────────────────────────────────────────
export const approveTherapist = async (req, res, next) => {
  try {
    const profile = await TherapistProfile.findById(req.params.id)
      .populate('user', '_id email');
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    profile.status = 'approved';
    profile.rejectionNote = '';
    await profile.save();

    // Emit realtime event to therapist
    try {
      const io = getIO();
      const userId = profile.user?._id?.toString();
      if (userId) {
        io.emit('therapist_approved', {
          therapistId: profile._id,
          userId: userId,
          message: 'Your application has been approved!',
        });
      }
    } catch (socketErr) {
      console.error('Socket emit failed:', socketErr.message);
    }

    res.json({ message: 'Therapist approved successfully', profile });
  } catch (error) { next(error); }
};

// ── Reject Therapist ─────────────────────────────────────────────────────────
export const rejectTherapist = async (req, res, next) => {
  try {
    const { error, value } = rejectTherapistSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const profile = await TherapistProfile.findById(req.params.id)
      .populate('user', '_id email');
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    profile.status = 'rejected';
    profile.rejectionNote = value.rejectionNote;
    await profile.save();

    // Emit realtime event to therapist
    try {
      const io = getIO();
      const userId = profile.user?._id?.toString();
      if (userId) {
        io.emit('therapist_rejected', {
          therapistId: profile._id,
          userId: userId,
          rejectionNote: value.rejectionNote,
          message: 'Your application has been rejected.',
        });
      }
    } catch (socketErr) {
      console.error('Socket emit failed:', socketErr.message);
    }

    res.json({ message: 'Therapist rejected', profile });
  } catch (error) { next(error); }
};

// ── Send Notification ────────────────────────────────────────────────────────
export const sendNotification = async (req, res, next) => {
  try {
    const { title, message, target } = req.body;
    const notification = await Notification.create({ title, message, target });
    res.status(201).json(notification);
  } catch (error) { next(error); }
};

// ── Get Reports ──────────────────────────────────────────────────────────────
export const getReports = async (req, res, next) => {
  try {
    const reports = await Report.find({});
    res.json(reports);
  } catch (error) { next(error); }
};
