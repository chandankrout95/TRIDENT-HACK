import Notification from '../models/notifications.model.js';

// Custom pseudo-push implementation (mocked FCM for simplicity now)
const sendPushNotification = async (req, res, next) => {
  try {
    const { user, title, message, type } = req.body;
    
    // 1. Create in DB
    const notif = await Notification.create({
      user: user || null,
      title,
      message,
      type
    });

    // 2. Here you would normally use firebase-admin to send FCM push
    // admin.messaging().sendToDevice(...)

    res.status(201).json({ success: true, notification: notif, message: 'Push sent securely' });
  } catch (error) {
    next(error);
  }
};

const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({
      $or: [{ user: req.user._id }, { user: null }]
    }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notif = await Notification.findOneAndUpdate(
      { _id: id, user: req.user._id }, 
      { isRead: true }, 
      { new: true }
    );
    res.json(notif);
  } catch (error) {
    next(error);
  }
};

export {  sendPushNotification, getMyNotifications, markAsRead  };
