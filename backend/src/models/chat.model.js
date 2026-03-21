import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // User or Therapist
  content: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  messageType: { type: String, enum: ['text', 'audio_call', 'video_call', 'missed_call', 'image'], default: 'text' },
  duration: { type: Number, default: 0 },
  imageUrl: { type: String },
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' }
}, { timestamps: true });

export default mongoose.model('Message', messageSchema);
