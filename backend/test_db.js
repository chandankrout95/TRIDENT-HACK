import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const UserSchema = new mongoose.Schema({ email: String, fcmTokens: [{ token: String, appType: String }] }, { strict: false });
const User = mongoose.model('User', UserSchema);

const TherapistProfileSchema = new mongoose.Schema({ user: mongoose.Schema.Types.ObjectId, specialization: String }, { strict: false });
const TherapistProfile = mongoose.model('TherapistProfile', TherapistProfileSchema);

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('Connected to DB');
    const therapists = await TherapistProfile.find({});
    console.log(`Found ${therapists.length} therapist profiles.`);
    for (const p of therapists) {
       const u = await User.findById(p.user);
       console.log(`Therapist ${u?.email} FCM Tokens: ${u?.fcmTokens?.length || 0}`);
    }
    process.exit(0);
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
