import TherapistProfile from '../models/therapists.model.js';
import User from '../models/auth.model.js';

// ── Submit Personal Info ─────────────────────────────────────────────────────
const submitPersonalInfo = async (userId, data) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  if (user.role !== 'therapist') throw new Error('Not a therapist account');

  // Find or create therapist profile
  let profile = await TherapistProfile.findOne({ user: userId });

  if (!profile) {
    profile = new TherapistProfile({
      user: userId,
      name: user.name,
      email: user.email,
      phone: user.phone,
    });
  }

  // Update fields
  profile.qualification = data.qualification;
  profile.experience = data.experience;
  profile.specialization = data.specialization;
  profile.bio = data.bio || '';
  profile.age = data.age;
  profile.dob = data.dob;
  profile.licenseNumber = data.licenseNumber || `LIC-${Date.now()}`;
  if (data.hourlyRate !== undefined) profile.hourlyRate = data.hourlyRate;
  if (data.languages !== undefined) profile.languages = data.languages;

  await profile.save();
  
  // Set user profile as complete
  user.isProfileComplete = true;
  await user.save();
  
  return profile;
};

// ── Add Document ─────────────────────────────────────────────────────────────
const addDocument = async (userId, documentType, fileUrl, publicId, originalName) => {
  const profile = await TherapistProfile.findOne({ user: userId });
  if (!profile) throw new Error('Therapist profile not found. Please complete personal info first.');

  // Remove existing document of same type (replace)
  profile.documents = profile.documents.filter(d => d.type !== documentType);

  profile.documents.push({
    type: documentType,
    url: fileUrl,
    publicId: publicId,
    originalName: originalName,
    uploadedAt: new Date(),
  });

  await profile.save();
  return profile;
};

// ── Submit Application ───────────────────────────────────────────────────────
const submitApplication = async (userId) => {
  const profile = await TherapistProfile.findOne({ user: userId });
  if (!profile) throw new Error('Therapist profile not found');

  // Check requirements
  if (!profile.qualification) {
    throw new Error('Please complete your personal information first');
  }

  const requiredDocs = ['medical_license', 'degree_certificate', 'government_id'];
  const uploadedTypes = profile.documents.map(d => d.type);
  const missingDocs = requiredDocs.filter(d => !uploadedTypes.includes(d));

  if (missingDocs.length > 0) {
    throw new Error(`Missing required documents: ${missingDocs.join(', ')}`);
  }

  profile.status = 'pending';
  profile.rejectionNote = '';
  await profile.save();

  return profile;
};

// ── Get Application Status ───────────────────────────────────────────────────
const getApplicationStatus = async (userId) => {
  const profile = await TherapistProfile.findOne({ user: userId });
  if (!profile) {
    return { status: 'no_profile', message: 'No therapist profile found' };
  }

  return {
    status: profile.status,
    rejectionNote: profile.rejectionNote,
    isProfileComplete: !!profile.qualification,
    hasDocuments: profile.documents?.length >= 3,
    documentsCount: profile.documents?.length || 0,
  };
};

// ── Reapply (re-upload docs only) ────────────────────────────────────────────
const reapply = async (userId) => {
  const profile = await TherapistProfile.findOne({ user: userId });
  if (!profile) throw new Error('Therapist profile not found');
  if (profile.status !== 'rejected') throw new Error('Can only reapply after rejection');

  // Clear documents for re-upload
  profile.documents = [];
  profile.status = 'pending';
  profile.rejectionNote = '';

  await profile.save();
  return profile;
};

export {
  submitPersonalInfo,
  addDocument,
  submitApplication,
  getApplicationStatus,
  reapply,
};
