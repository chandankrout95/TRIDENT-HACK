import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedNotifications = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Make sure we have a user
    const users = await User.find({});
    if (users.length === 0) {
      console.log('No users found in database.');
      process.exit();
    }

    // Clear existing for a fresh seed
    await Notification.deleteMany({});

    for (const user of users) {
      const isTherapist = user.role === 'therapist';
      
      const notifications = [
        {
          user: user._id,
          title: 'Welcome to Trident!',
          message: 'We are thrilled to have you here. Explore and start your journey.',
          type: 'system',
          isRead: false
        },
        {
          user: user._id,
          title: 'New Session Scheduled',
          message: isTherapist ? 'A client has booked a new upcoming session.' : 'Your session has been successfully booked.',
          type: 'session',
          isRead: true
        },
        {
          user: user._id,
          title: 'Unread Message',
          message: 'You have unread messages in your inbox. Please check them out.',
          type: 'chat',
          isRead: false
        },
        {
          user: user._id,
          title: 'Payment Processed',
          message: isTherapist ? 'Earnings for your last session have been credited.' : 'Your payment went through successfully.',
          type: 'payment',
          isRead: true
        }
      ];

      await Notification.insertMany(notifications);
    }

    // Global
    await Notification.create({
      user: null,
      title: 'System Update Completed',
      message: 'We have updated our terms and conditions. Please read to accept.',
      type: 'system',
      isRead: false
    });

    console.log('Notifications seeded successfully!');
    process.exit();
  } catch (error) {
    console.error('Error seeding notifications:', error);
    process.exit(1);
  }
};

seedNotifications();
