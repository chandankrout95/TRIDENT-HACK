import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from './src/models/auth.model.js';
import { sendPushNotification } from './src/services/pushNotification.service.js';

async function testPush() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  // Find users with FCM tokens
  const users = await User.find({ 'fcmTokens.0': { $exists: true } });
  if (users.length === 0) {
    console.log('No users with FCM tokens found.');
    process.exit(1);
  }

  const user = users[0];
  console.log(`Sending test push to user: ${user._id} (${user.email})`);
  console.log(`Tokens:`, user.fcmTokens);

  await sendPushNotification(user._id, 'Test Push', 'This is a test notification from the backend debugging script.', {
    type: 'test'
  });

  console.log('Push dispatched.');
  process.exit(0);
}

testPush().catch(console.error);
