import TherapistProfile from '../models/therapists.model.js';
import User from '../models/auth.model.js'; // Re-using auth user table

const getAllTherapistsAdmin = async (req, res, next) => {
  try {
    const therapists = await TherapistProfile.find().populate('user', 'email isVerified');
    res.json(therapists);
  } catch (error) {
    next(error);
  }
};

const approveTherapist = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;
    
    const therapist = await TherapistProfile.findByIdAndUpdate(
      id, 
      { isApproved }, 
      { new: true }
    );
    
    if (!therapist) return res.status(404).json({ message: 'Therapist not found' });
    res.json({ message: `Therapist ${isApproved ? 'approved' : 'rejected'}`, therapist });
  } catch (error) {
    next(error);
  }
};

const getApprovedTherapists = async (req, res, next) => {
  try {
    const therapists = await TherapistProfile.find({ isApproved: true }).select('-availability');
    res.json(therapists);
  } catch (error) {
    next(error);
  }
};

const createOrUpdateProfile = async (req, res, next) => {
  try {
    const { name, specialization, licenseNumber, bio, hourlyRate, availability } = req.body;
    let profile = await TherapistProfile.findOne({ user: req.user._id });

    if (profile) {
      profile.name = name || profile.name;
      profile.specialization = specialization || profile.specialization;
      profile.bio = bio || profile.bio;
      profile.hourlyRate = hourlyRate || profile.hourlyRate;
      if (availability) profile.availability = availability;
      await profile.save();
    } else {
      profile = await TherapistProfile.create({
        user: req.user._id,
        name, specialization, licenseNumber, bio, hourlyRate, availability
      });
    }

    res.json(profile);
  } catch (error) {
    next(error);
  }
};

export {  getAllTherapistsAdmin, approveTherapist, getApprovedTherapists, createOrUpdateProfile  };
