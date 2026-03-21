import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional, null means broadcast to all
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  type: { type: String, enum: ['system', 'session', 'chat', 'payment'], default: 'system' }
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);
