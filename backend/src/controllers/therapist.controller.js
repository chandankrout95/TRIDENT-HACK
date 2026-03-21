import Session from '../models/sessions.model.js';
import TherapistProfile from '../models/therapists.model.js';

export const getTherapistSessions = async (req, res, next) => {
  try {
    const therapistProfile = await TherapistProfile.findOne({ user: req.user._id });
    if (!therapistProfile) return res.status(404).json({ message: 'Therapist profile not found' });
    
    const sessions = await Session.find({ therapist: therapistProfile._id })
      .populate('user', 'name email');
      
    res.json(sessions);
  } catch (error) { next(error); }
};

export const updateSessionStatus = async (req, res, next) => {
  try {
    const session = await Session.findByIdAndUpdate(
      req.params.id, 
      { status: req.body.status },
      { new: true }
    );
    res.json(session);
  } catch (error) { next(error); }
};
