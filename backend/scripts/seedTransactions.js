import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import Transaction from '../src/models/transactions.model.js';
import User from '../src/models/auth.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedTransactions = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const therapists = await User.find({ role: 'therapist' });
    if (therapists.length === 0) {
      console.log('No therapists found in database.');
      process.exit();
    }

    await Transaction.deleteMany({});

    for (const therapist of therapists) {
      const transactions = [
        {
          therapist: therapist._id,
          amount: 500,
          type: 'earning',
          status: 'completed',
          description: 'Payment for Session #1001'
        },
        {
          therapist: therapist._id,
          amount: 500,
          type: 'earning',
          status: 'completed',
          description: 'Payment for Session #1002'
        },
        {
          therapist: therapist._id,
          amount: 500,
          type: 'earning',
          status: 'completed',
          description: 'Payment for Session #1003'
        },
        {
          therapist: therapist._id,
          amount: 500,
          type: 'earning',
          status: 'completed',
          description: 'Payment for Session #1004'
        },
        {
          therapist: therapist._id,
          amount: 500,
          type: 'earning',
          status: 'completed',
          description: 'Payment for Session #1005'
        },
        {
          therapist: therapist._id,
          amount: 1000,
          type: 'withdrawal',
          status: 'completed',
          description: 'Withdrawal to UPI: therapist@okaxis',
          upiId: 'therapist@okaxis'
        },
        {
          therapist: therapist._id,
          amount: 500,
          type: 'earning',
          status: 'completed',
          description: 'Payment for Session #1006'
        }
      ];

      // Add small delays to mimic time differences
      for (let i = 0; i < transactions.length; i++) {
        let t = new Transaction(transactions[i]);
        // artificially offset the created at so they sort nicely
        t.createdAt = new Date(Date.now() - (transactions.length - i) * 86400000); 
        await t.save();
      }
    }

    console.log('Transactions seeded successfully!');
    process.exit();
  } catch (error) {
    console.error('Error seeding transactions:', error);
    process.exit(1);
  }
};

seedTransactions();
