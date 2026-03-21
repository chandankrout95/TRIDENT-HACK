import User from '../models/auth.model.js';
import TherapistProfile from '../models/therapists.model.js';
import Notification from '../models/notifications.model.js';
import Report from '../models/reports.model.js';

export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({ role: 'user' }).select('-password');
    res.json(users);
  } catch (error) { next(error); }
};

export const blockUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json(user);
  } catch (error) { next(error); }
};

export const getPendingTherapists = async (req, res, next) => {
  try {
    const pending = await TherapistProfile.find({ isApproved: false }).populate('user', 'email');
    res.json(pending);
  } catch (error) { next(error); }
};

export const approveTherapist = async (req, res, next) => {
  try {
    const profile = await TherapistProfile.findById(req.params.id);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    profile.isApproved = true;
    await profile.save();
    res.json({ message: 'Approved successfully', profile });
  } catch (error) { next(error); }
};

export const rejectTherapist = async (req, res, next) => {
  try {
    await TherapistProfile.findByIdAndDelete(req.params.id);
    res.json({ message: 'Rejected mapping' });
  } catch (error) { next(error); }
};

export const sendNotification = async (req, res, next) => {
  try {
    const { title, message, target } = req.body;
    const notification = await Notification.create({ title, message, target });
    res.status(201).json(notification);
  } catch (error) { next(error); }
};

export const getReports = async (req, res, next) => {
  try {
    const reports = await Report.find({});
    res.json(reports);
  } catch (error) { next(error); }
};
