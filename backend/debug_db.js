import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/auth.model.js';
import TherapistProfile from './src/models/therapists.model.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const users = await User.find();
  console.log('All users in DB:', users.length);
  const regularUsers = await User.find({ role: 'user' });
  console.log('Users with role = user:', regularUsers.length);
  const adminUsers = await User.find({ role: 'admin' });
  console.log('Users with role = admin:', adminUsers.length);
  
  const therapists = await TherapistProfile.find();
  console.log('All therapists in DB:', therapists.length);
  const approvedTherapists = await TherapistProfile.find({ isApproved: true });
  console.log('Approved therapists:', approvedTherapists.length);

  mongoose.connection.close();
}).catch(console.error);
