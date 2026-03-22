import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const User = mongoose.model('User', new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    phone: String,
    password: String,
    role: { type: String, default: 'user' },
    profileImage: { type: String, default: '' },
    age: Number,
    dob: Date,
    hobby: String,
    occupation: String,
    gender: String,
    bio: String,
    isVerified: { type: Boolean, default: false },
    isProfileComplete: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
  }, { timestamps: true }));

  const EmergencyContact = mongoose.model('EmergencyContact', new mongoose.Schema({
    role: String,
    icon: String,
    color: String,
    desc: String,
    phoneNumber: String,
    isActive: { type: Boolean, default: true },
  }, { timestamps: true }));

  const TherapistProfile = mongoose.model('TherapistProfile', new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    email: String,
    phone: String,
    specialization: String,
    qualification: String,
    experience: String,
    licenseNumber: { type: String, unique: true, sparse: true },
    bio: String,
    age: Number,
    dob: Date,
    hourlyRate: { type: Number, default: 50 },
    rating: { type: Number, default: 4.5 },
    reviewCount: { type: Number, default: 0 },
    languages: [String],
    profileImage: String,
    documents: [{
      type: { type: String },
      url: String,
      publicId: String,
      originalName: String,
      uploadedAt: Date,
    }],
    status: { type: String, default: 'pending' },
    isApproved: { type: Boolean, default: false },
    rejectionNote: String,
    availability: [{
      day: String,
      slots: [{ startTime: String, endTime: String }],
    }],
  }, { timestamps: true }));

  // Clear existing data
  await User.deleteMany({});
  await TherapistProfile.deleteMany({});
  await EmergencyContact.deleteMany({});
  console.log('Cleared existing data');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // ── Create Admin ─────────────────────────────────────────────────────────
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@trident.com',
    phone: '9999999999',
    password: hashedPassword,
    role: 'admin',
    isVerified: true,
    isProfileComplete: true,
  });
  console.log('Created admin:', admin.email);

  // ── Create 10 Users ──────────────────────────────────────────────────────
  const userNames = [
    'Alice Johnson', 'Bob Smith', 'Charlie Brown', 'Diana Prince',
    'Eve Thompson', 'Frank Castle', 'Grace Lee', 'Henry Wilson',
    'Ivy Chen', 'Jack Davis',
  ];

  const users = [];
  for (let i = 0; i < 10; i++) {
    const user = await User.create({
      name: userNames[i],
      email: `user${i + 1}@trident.com`,
      phone: `98765${String(i).padStart(5, '0')}`,
      password: hashedPassword,
      role: 'user',
      isVerified: true,
      isProfileComplete: true,
      age: 25 + i,
      dob: new Date(2000 - i, 5, 15),
      hobby: ['Reading', 'Yoga', 'Running', 'Cooking', 'Music'][i % 5],
      occupation: ['Engineer', 'Teacher', 'Student', 'Designer', 'Writer'][i % 5],
      gender: i % 3 === 0 ? 'male' : i % 3 === 1 ? 'female' : 'other',
      bio: `Hi, I am ${userNames[i]}. Looking forward to improving my mental health.`,
    });
    users.push(user);
  }
  console.log('Created 10 users');

  // ── Create 5 Approved Therapists ─────────────────────────────────────────
  const therapistNames = [
    'Dr. Sarah Mitchell', 'Dr. James Rodriguez', 'Dr. Priya Patel',
    'Dr. Michael Chen', 'Dr. Emily Watson',
  ];
  const specializations = [
    'Anxiety & Depression', 'PTSD & Trauma', 'Family Therapy',
    'Cognitive Behavioral Therapy', 'Mindfulness & Stress',
  ];

  for (let i = 0; i < 5; i++) {
    const therapistUser = await User.create({
      name: therapistNames[i],
      email: `therapist${i + 1}@trident.com`,
      phone: `91234${String(i).padStart(5, '0')}`,
      password: hashedPassword,
      role: 'therapist',
      isVerified: true,
      isProfileComplete: true,
    });

    await TherapistProfile.create({
      user: therapistUser._id,
      name: therapistNames[i],
      email: therapistUser.email,
      phone: therapistUser.phone,
      specialization: specializations[i],
      qualification: 'MD Psychiatry, PhD Clinical Psychology',
      experience: `${5 + i * 2} years in clinical practice`,
      licenseNumber: `LIC-${1000 + i}`,
      bio: `Experienced therapist specializing in ${specializations[i]} with a compassionate approach.`,
      age: 35 + i * 3,
      dob: new Date(1988 - i * 3, 3, 10),
      hourlyRate: 50 + i * 10,
      rating: 4.2 + i * 0.15,
      reviewCount: 10 + i * 5,
      languages: ['English', 'Hindi'],
      status: 'approved',
      isApproved: true,
      documents: [
        { type: 'medical_license', url: 'https://res.cloudinary.com/demo/image/upload/sample.pdf', originalName: 'medical_license.pdf', uploadedAt: new Date() },
        { type: 'degree_certificate', url: 'https://res.cloudinary.com/demo/image/upload/sample.pdf', originalName: 'degree.pdf', uploadedAt: new Date() },
        { type: 'government_id', url: 'https://res.cloudinary.com/demo/image/upload/sample.pdf', originalName: 'govt_id.pdf', uploadedAt: new Date() },
      ],
      availability: [
        { day: 'Monday', slots: [{ startTime: '09:00 AM', endTime: '10:00 AM' }, { startTime: '02:00 PM', endTime: '03:00 PM' }] },
        { day: 'Wednesday', slots: [{ startTime: '10:00 AM', endTime: '11:00 AM' }] },
        { day: 'Friday', slots: [{ startTime: '03:00 PM', endTime: '04:00 PM' }] },
      ],
    });
  }
  console.log('Created 5 approved therapists');

  // ── Create 3 Pending Therapist Applications ──────────────────────────────
  const pendingNames = ['Dr. Lisa Brown', 'Dr. Raj Kumar', 'Dr. Anna Schmidt'];
  const pendingSpecs = ['Child Psychology', 'Addiction Counseling', 'Relationship Therapy'];

  for (let i = 0; i < 3; i++) {
    const pendingUser = await User.create({
      name: pendingNames[i],
      email: `pending${i + 1}@trident.com`,
      phone: `90000${String(i).padStart(5, '0')}`,
      password: hashedPassword,
      role: 'therapist',
      isVerified: true,
      isProfileComplete: true,
    });

    await TherapistProfile.create({
      user: pendingUser._id,
      name: pendingNames[i],
      email: pendingUser.email,
      phone: pendingUser.phone,
      specialization: pendingSpecs[i],
      qualification: 'MSc Clinical Psychology, Certified CBT Practitioner',
      experience: `${3 + i} years experience`,
      licenseNumber: `LIC-PEND-${2000 + i}`,
      bio: `Passionate therapist applying to join the platform, specializing in ${pendingSpecs[i]}.`,
      age: 30 + i,
      status: 'pending',
      isApproved: false,
      documents: [
        { type: 'medical_license', url: 'https://res.cloudinary.com/demo/image/upload/sample.pdf', originalName: 'license.pdf', uploadedAt: new Date() },
        { type: 'degree_certificate', url: 'https://res.cloudinary.com/demo/image/upload/sample.pdf', originalName: 'certificate.pdf', uploadedAt: new Date() },
        { type: 'government_id', url: 'https://res.cloudinary.com/demo/image/upload/sample.pdf', originalName: 'id_proof.pdf', uploadedAt: new Date() },
      ],
    });
  }
  console.log('Created 3 pending therapist applications');

  // ── Create Emergency Contacts ──────────────────────────────────────────────
  const emergencyContacts = [
    { role: 'Anxiety & Panic Specialist', icon: 'pulse', color: '#059669', desc: 'Immediate psychological support', phoneNumber: '9937353078' },
    { role: 'General Trauma Doctor', icon: 'medkit', color: '#2563EB', desc: 'Critical physical & mental care', phoneNumber: '9937353078' },
    { role: 'Depression & Crisis Counselor', icon: 'heart-half', color: '#D97706', desc: 'Safe, confidential intervention', phoneNumber: '9937353078' },
    { role: 'Pediatric Care Specialist', icon: 'happy', color: '#8B5CF6', desc: 'Emergency child health support', phoneNumber: '9937353078' },
  ];

  await EmergencyContact.insertMany(emergencyContacts);
  console.log('Created 4 emergency contacts');

  console.log('\n=== SEED COMPLETE ===');
  console.log('Admin:   admin@trident.com / password123');
  console.log('Users:   user1@trident.com ... user10@trident.com / password123');
  console.log('Therapists: therapist1@trident.com ... therapist5@trident.com / password123');
  console.log('Pending:    pending1@trident.com ... pending3@trident.com / password123');
  console.log('Emergency:  4 contacts seeded successfully');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
