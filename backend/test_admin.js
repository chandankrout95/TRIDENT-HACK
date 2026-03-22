import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from './src/models/auth.model.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    console.log("No admin found.");
    process.exit(1);
  }
  
  const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
  
  try {
    const res = await fetch('http://localhost:5000/api/admin/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log("GET /admin/users:", await res.json());

    const res2 = await fetch('http://localhost:5000/api/admin/therapists', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log("GET /admin/therapists:", await res2.json());

    const res3 = await fetch('http://localhost:5000/api/admin/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log("GET /admin/stats:", await res3.json());
  } catch (err) {
    console.error("Fetch error:", err);
  }
  
  mongoose.connection.close();
});
