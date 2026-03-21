import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/auth.model.js';
import TherapistProfile from './src/models/therapists.model.js';
import Session from './src/models/sessions.model.js';
import Notification from './src/models/notifications.model.js';
import Message from './src/models/chat.model.js';
import Exercise from './src/models/exercises.model.js';
import Report from './src/models/reports.model.js';
import MoodTracking from './src/models/moodTracking.model.js';

dotenv.config();

const therapistData = [
  { name: 'Dr. Jane Smith', email: 'jane.smith@trident.com', spec: 'Cognitive Behavioral Therapy', license: 'CBT-100001', bio: 'Specializes in anxiety, depression, and OCD using evidence-based CBT techniques. Published researcher with a compassionate approach.', rate: 120, rating: 4.9, reviews: 214, years: 12, langs: ['English', 'Spanish'] },
  { name: 'Dr. Arjun Mehta', email: 'arjun.mehta@trident.com', spec: 'Family Therapy', license: 'FT-200002', bio: 'Expert in family dynamics, relationship counseling, and conflict resolution. Helps families build stronger bonds.', rate: 95, rating: 4.7, reviews: 158, years: 8, langs: ['English', 'Hindi'] },
  { name: 'Dr. Emily Chen', email: 'emily.chen@trident.com', spec: 'Child & Adolescent Psychology', license: 'CAP-300003', bio: 'Passionate about helping children and teens navigate emotional challenges, bullying, and academic stress.', rate: 110, rating: 4.8, reviews: 192, years: 10, langs: ['English', 'Mandarin'] },
  { name: 'Dr. Michael Brooks', email: 'michael.brooks@trident.com', spec: 'PTSD & Trauma Recovery', license: 'PTR-400004', bio: 'Veteran trauma specialist using EMDR and somatic experiencing to help survivors reclaim their lives.', rate: 150, rating: 4.9, reviews: 287, years: 15, langs: ['English'] },
  { name: 'Dr. Priya Sharma', email: 'priya.sharma@trident.com', spec: 'Addiction & Substance Abuse', license: 'ASA-500005', bio: 'Guides individuals through recovery from addiction with motivational interviewing and relapse prevention strategies.', rate: 100, rating: 4.6, reviews: 134, years: 7, langs: ['English', 'Hindi', 'Punjabi'] },
  { name: 'Dr. Sarah Johnson', email: 'sarah.johnson@trident.com', spec: 'Couples Counseling', license: 'CC-600006', bio: 'Gottman-certified couples therapist specializing in communication skills, intimacy issues, and pre-marital counseling.', rate: 130, rating: 4.8, reviews: 203, years: 11, langs: ['English', 'French'] },
  { name: 'Dr. David Kim', email: 'david.kim@trident.com', spec: 'Mindfulness & Stress Management', license: 'MSM-700007', bio: 'Integrates mindfulness-based stress reduction (MBSR) with traditional therapy for holistic mental wellness.', rate: 85, rating: 4.5, reviews: 98, years: 5, langs: ['English', 'Korean'] },
  { name: 'Dr. Fatima Al-Rashid', email: 'fatima.rashid@trident.com', spec: 'Grief & Loss Counseling', license: 'GLC-800008', bio: 'Compassionate grief counselor helping individuals process loss, bereavement, and life transitions with dignity.', rate: 90, rating: 4.7, reviews: 167, years: 9, langs: ['English', 'Arabic'] },
  { name: 'Dr. James Wilson', email: 'james.wilson@trident.com', spec: 'Anger Management', license: 'AM-900009', bio: 'Specializes in emotional regulation, impulse control, and anger management through dialectical behavior therapy.', rate: 80, rating: 4.4, reviews: 76, years: 6, langs: ['English'] },
  { name: 'Dr. Lisa Fernandez', email: 'lisa.fernandez@trident.com', spec: 'Eating Disorders', license: 'ED-100010', bio: 'Expert in treating anorexia, bulimia, and binge eating disorder. Uses a holistic, body-positive approach.', rate: 140, rating: 4.9, reviews: 231, years: 13, langs: ['English', 'Spanish', 'Portuguese'] },
  { name: 'Dr. Robert Taylor', email: 'robert.taylor@trident.com', spec: 'Sleep Disorders & Insomnia', license: 'SDI-110011', bio: 'Board-certified sleep specialist offering CBT-I and lifestyle coaching for chronic insomnia and sleep anxiety.', rate: 105, rating: 4.6, reviews: 112, years: 8, langs: ['English'] },
  { name: 'Dr. Ananya Patel', email: 'ananya.patel@trident.com', spec: 'Career & Life Coaching', license: 'CLC-120012', bio: 'Helps professionals overcome burnout, imposter syndrome, and career transitions with structured goal-setting.', rate: 75, rating: 4.5, reviews: 89, years: 4, langs: ['English', 'Hindi', 'Gujarati'] },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for Seeding...');

    // Clear existing
    await User.deleteMany();
    await TherapistProfile.deleteMany();
    await Session.deleteMany();
    await Notification.deleteMany();
    await Message.deleteMany();
    await Exercise.deleteMany();
    await Report.deleteMany();
    await MoodTracking.deleteMany();

    // 1. Seed Admin
    const admin = await User.create({
      email: process.env.EMAIL_USER || 'admin@trident.com',
      password: 'password123',
      role: 'admin',
      isVerified: true
    });

    // 2. Seed User
    const user = await User.create({
      email: 'user@trident.com',
      password: 'password123',
      role: 'user',
      isVerified: true
    });

    // 3. Seed 12 Therapists
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const slotSets = [
      [{ startTime: '09:00 AM', endTime: '10:00 AM' }, { startTime: '10:00 AM', endTime: '11:00 AM' }],
      [{ startTime: '11:00 AM', endTime: '12:00 PM' }, { startTime: '02:00 PM', endTime: '03:00 PM' }],
      [{ startTime: '03:00 PM', endTime: '04:00 PM' }, { startTime: '04:00 PM', endTime: '05:00 PM' }],
    ];

    for (const t of therapistData) {
      const therapistUser = await User.create({
        email: t.email,
        password: 'password123',
        role: 'therapist',
        isVerified: true
      });

      const availability = days.map((day, i) => ({
        day,
        slots: slotSets[i % slotSets.length]
      }));

      await TherapistProfile.create({
        user: therapistUser._id,
        name: t.name,
        specialization: t.spec,
        licenseNumber: t.license,
        bio: t.bio,
        hourlyRate: t.rate,
        rating: t.rating,
        reviewCount: t.reviews,
        yearsExperience: t.years,
        languages: t.langs,
        isApproved: true,
        availability
      });
    }

    // 4. Seed multiple Sessions for the user
    const allTherapists = await TherapistProfile.find();
    const sessionSeeds = [
      { therapistIdx: 0, daysFromNow: 1, slot: '09:00 AM - 10:00 AM', status: 'confirmed' },
      { therapistIdx: 1, daysFromNow: 2, slot: '11:00 AM - 12:00 PM', status: 'pending' },
      { therapistIdx: 3, daysFromNow: 3, slot: '02:00 PM - 03:00 PM', status: 'confirmed' },
      { therapistIdx: 5, daysFromNow: -2, slot: '10:00 AM - 11:00 AM', status: 'completed' },
      { therapistIdx: 7, daysFromNow: -5, slot: '04:00 PM - 05:00 PM', status: 'completed' },
    ];

    for (const s of sessionSeeds) {
      const d = new Date();
      d.setDate(d.getDate() + s.daysFromNow);
      await Session.create({
        user: user._id,
        therapist: allTherapists[s.therapistIdx]._id,
        date: d,
        timeSlot: s.slot,
        status: s.status,
      });
    }

    // 5. Seed Exercises (expanded)
    await Exercise.create([
      { title: 'Deep Breathing', duration: '5 min', type: 'Relaxation', color: '#D1FAE5', textColor: '#065F46' },
      { title: 'Guided Meditation', duration: '10 min', type: 'Focus', color: '#FEF3C7', textColor: '#92400E' },
      { title: 'Stress Relief Scan', duration: '15 min', type: 'Anxiety', color: '#FCE7F3', textColor: '#9D174D' },
      { title: 'Sleep Visualization', duration: '20 min', type: 'Sleep', color: '#E0E7FF', textColor: '#3730A3' },
      { title: 'Body Relaxation', duration: '12 min', type: 'Relaxation', color: '#DCFCE7', textColor: '#166534' },
      { title: 'Focus Builder', duration: '8 min', type: 'Focus', color: '#FFF7ED', textColor: '#9A3412' },
    ]);

    // 6. Seed Notifications for user
    const now = new Date();
    await Notification.create([
      { user: user._id, title: 'Session Confirmed', message: 'Your session with Dr. Jane Smith on tomorrow at 09:00 AM has been confirmed.', type: 'session', isRead: false, createdAt: new Date(now - 1000 * 60 * 30) },
      { user: user._id, title: 'New Message', message: 'Dr. Arjun Mehta sent you a message: "Looking forward to our session!"', type: 'chat', isRead: false, createdAt: new Date(now - 1000 * 60 * 60 * 2) },
      { user: user._id, title: 'Payment Received', message: 'Your payment of $120 for the session with Dr. Jane Smith has been processed.', type: 'payment', isRead: true, createdAt: new Date(now - 1000 * 60 * 60 * 5) },
      { user: user._id, title: 'Complete Your Profile', message: 'Add your health information to get personalized therapy recommendations.', type: 'system', isRead: false, createdAt: new Date(now - 1000 * 60 * 60 * 12) },
      { user: user._id, title: 'Weekly Report Ready', message: 'Your weekly wellness report is available. Check your progress and insights.', type: 'system', isRead: true, createdAt: new Date(now - 1000 * 60 * 60 * 24) },
      { user: user._id, title: 'Reminder: Session Tomorrow', message: 'Don\'t forget your upcoming session with Dr. Michael Brooks at 02:00 PM.', type: 'session', isRead: false, createdAt: new Date(now - 1000 * 60 * 60 * 3) },
    ]);

    // 7. Seed Reports
    await Report.create([
      { name: 'Monthly User Engagement', date: new Date().toISOString().split('T')[0], size: '2.4 MB' },
      { name: 'Therapist Earnings Q3', date: '2023-10-15', size: '1.1 MB' },
      { name: 'Platform System Logs', date: '2023-11-20', size: '5.6 MB' },
    ]);

    console.log('Seeding Complete! 🎉');
    console.log('----------------------------------------------------');
    console.log('Credentials:');
    console.log(`Admin Email:     ${admin.email} (Password: password123)`);
    console.log(`User Email:      ${user.email} (Password: password123)`);
    console.log(`Therapists:      ${therapistData.length} therapists seeded`);
    console.log('----------------------------------------------------');
    process.exit();
  } catch (err) {
    console.error('Seeding Failed:', err);
    process.exit(1);
  }
};

seedDB();
