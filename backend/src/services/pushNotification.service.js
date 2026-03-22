import admin from '../config/firebase.js';
import User from '../models/auth.model.js';
import Notification from '../models/notifications.model.js';

export const sendPushNotification = async (userId, title, body, data = {}, type = 'system') => {
  try {
    // 1. Save to DB for in-app notification history
    await Notification.create({
      user: userId,
      title,
      message: body,
      type
    });

    // 2. Fetch user's FCM tokens
    const user = await User.findById(userId).select('fcmTokens').lean();
    if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
      console.log(`No FCM tokens for user ${userId}`);
      return;
    }

    const tokens = user.fcmTokens.map(t => t.token);

    // 3. Send via Firebase Admin
    const message = {
      notification: { title, body },
      data: {
        ...data,
        type,
        click_action: 'FLUTTER_NOTIFICATION_CLICK' // Standard for RN too
      },
      tokens
    };

    console.log(`Sending push to ${tokens.length} tokens for user ${userId}`);
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`Firebase response for ${userId}:`, JSON.stringify(response, null, 2));
    
    // 4. Cleanup invalid tokens (unregistered devices)
    if (response.failureCount > 0) {
      const invalidTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success && (resp.error.code === 'messaging/invalid-registration-token' || resp.error.code === 'messaging/registration-token-not-registered')) {
          invalidTokens.push(tokens[idx]);
        }
      });

      if (invalidTokens.length > 0) {
        await User.findByIdAndUpdate(userId, {
          $pull: { fcmTokens: { token: { $in: invalidTokens } } }
        });
        console.log(`Removed ${invalidTokens.length} invalid FCM tokens for user ${userId}`);
      }
    }

    return response;
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};
