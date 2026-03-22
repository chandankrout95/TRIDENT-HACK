import * as therapistService from '../services/therapist.service.js';
import { therapistPersonalInfoSchema } from '../validations/therapist.validation.js';
import TherapistProfile from '../models/therapists.model.js';
import Session from '../models/sessions.model.js';
import { getIO } from '../config/socket.js';

// ── Submit Personal Info ─────────────────────────────────────────────────────
export const submitPersonalInfo = async (req, res, next) => {
  try {
    const { error, value } = therapistPersonalInfoSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const profile = await therapistService.submitPersonalInfo(req.user._id, value);
    res.json({
      message: 'Personal information saved successfully',
      profile: {
        _id: profile._id,
        name: profile.name,
        qualification: profile.qualification,
        experience: profile.experience,
        specialization: profile.specialization,
        bio: profile.bio,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── Upload Document ──────────────────────────────────────────────────────────
export const uploadDocument = async (req, res, next) => {
  try {
    const { documentType } = req.body;
    const validTypes = ['medical_license', 'degree_certificate', 'government_id'];

    if (!documentType || !validTypes.includes(documentType)) {
      return res.status(400).json({
        message: `Invalid document type. Must be one of: ${validTypes.join(', ')}`,
      });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const profile = await therapistService.addDocument(
      req.user._id,
      documentType,
      req.file.path, // Cloudinary URL
      req.file.filename, // Cloudinary public_id
      req.file.originalname,
    );

    res.json({
      message: 'Document uploaded successfully',
      document: profile.documents.find(d => d.type === documentType),
      documentsCount: profile.documents.length,
    });
  } catch (err) {
    next(err);
  }
};

// ── Submit Application ───────────────────────────────────────────────────────
export const submitApplication = async (req, res, next) => {
  try {
    const profile = await therapistService.submitApplication(req.user._id);

    // Emit socket event to admin
    try {
      const io = getIO();
      io.emit('therapist_application_created', {
        therapistId: profile._id,
        name: profile.name,
        specialization: profile.specialization,
        createdAt: new Date(),
      });
    } catch (socketErr) {
      console.error('Socket emit failed:', socketErr.message);
    }

    res.json({
      message: 'Application submitted successfully. Waiting for admin approval.',
      status: profile.status,
    });
  } catch (err) {
    next(err);
  }
};

// ── Get Application Status ───────────────────────────────────────────────────
export const getApplicationStatus = async (req, res, next) => {
  try {
    const status = await therapistService.getApplicationStatus(req.user._id);
    res.json(status);
  } catch (err) {
    next(err);
  }
};

// ── Get My Profile ───────────────────────────────────────────────────────────
export const getMyProfile = async (req, res, next) => {
  try {
    const profile = await TherapistProfile.findOne({ user: req.user._id })
      .populate('user', 'email name phone profileImage');
    
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    // Calculate real stats
    const allSessions = await Session.find({ therapist: profile._id });
    const completedSessions = allSessions.filter(s => s.status === 'completed');
    
    const uniqueClients = new Set(allSessions.map(s => s.user.toString())).size;
    
    // In a real app, ratings would be in a separate Reviews model, 
    // but here we check the therapist profile's rating which can be updated by reviews.
    // For now, let's keep it dynamic or default to 0 for new ones.
    const displayRating = profile.reviewCount > 0 ? profile.rating : 0;

    res.json({
      ...profile.toObject(),
      clientsCount: uniqueClients || 0,
      completedCount: completedSessions.length || 0,
      rating: displayRating
    });
  } catch (err) {
    next(err);
  }
};

// ── Reapply ──────────────────────────────────────────────────────────────────
export const reapplyApplication = async (req, res, next) => {
  try {
    const profile = await therapistService.reapply(req.user._id);
    res.json({
      message: 'Profile reset for reapplication. Please re-upload your documents.',
      status: profile.status,
    });
  } catch (err) {
    next(err);
  }
};

// ── Get My Sessions ──────────────────────────────────────────────────────────
export const getMySessions = async (req, res, next) => {
  try {
    const profile = await TherapistProfile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Therapist profile not found' });

    const sessions = await Session.find({ therapist: profile._id })
      .populate('user', 'name email phone profileImage')
      .sort({ date: -1 });

    res.json(sessions);
  } catch (err) {
    next(err);
  }
};

export const updateSessionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'confirmed' or 'cancelled'
    
    const profile = await TherapistProfile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    const session = await Session.findOne({ _id: id, therapist: profile._id });
    if (!session) return res.status(404).json({ message: 'Session not found' });

    if (session.status !== 'pending') {
      return res.status(400).json({ message: `Cannot change status from ${session.status}` });
    }

    session.status = status;
    
    // Automatically generate OTP if therapist accepts the booking
    if (status === 'confirmed') {
      session.completionOtp = Math.floor(1000 + Math.random() * 9000).toString();
    }

    await session.save();

    // Send Push Notification to User
    import('../services/pushNotification.service.js').then(({ sendPushNotification }) => {
      const title = `Session ${status.charAt(0).toUpperCase() + status.slice(1)}`;
      const body = `Your session has been ${status} by Dr. ${profile.user?.name || 'Therapist'}.`;
      sendPushNotification(session.user._id, title, body, { type: 'session', sessionId: session._id.toString() });
    });

    try {
      getIO().emit('session_status_update', session);
    } catch (e) {
      console.error('Socket error on status update:', e);
    }

    res.json(session);
  } catch (err) {
    next(err);
  }
};

export const completeSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;
    
    const profile = await TherapistProfile.findOne({ user: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });

    const session = await Session.findOne({ _id: id, therapist: profile._id }).populate('user', 'name');
    if (!session) return res.status(404).json({ message: 'Session not found' });

    if (session.status !== 'confirmed') {
      return res.status(400).json({ message: `Session is not confirmed. Current status: ${session.status}` });
    }

    if (!otp || otp !== session.completionOtp) {
      return res.status(400).json({ message: 'Invalid OTP provided for completion.' });
    }

    session.status = 'completed';
    await session.save();

    // Auto-create earning transaction based on therapist's hourly rate
    const Transaction = (await import('../models/transactions.model.js')).default;
    const earningAmount = profile.hourlyRate || 500; // Default ₹500 per session
    await Transaction.create({
      therapist: req.user._id,
      amount: earningAmount,
      type: 'earning',
      status: 'completed',
      description: `Session with ${session.user?.name || 'Client'}`,
    });
    
    try {
      getIO().emit('session_status_update', session);
    } catch (e) {
      console.error('Socket error on status complete:', e);
    }

    res.json(session);
  } catch (err) {
    next(err);
  }
};

