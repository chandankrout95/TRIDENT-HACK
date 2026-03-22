import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Load directly from the provided path
const serviceAccountPath = '/Users/chandankumarrout/Downloads/mental-health-platform-e0003-firebase-adminsdk-fbsvc-e60b88c5a0.json';
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin initialized successfully.');
}

export default admin;
