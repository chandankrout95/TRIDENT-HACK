import mongoose from 'mongoose';

const aiMessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  persona: { type: String, required: true }, // 'Girlfriend', 'Mother', etc.
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  messageType: { type: String, enum: ['text', 'image'], default: 'text' },
}, { timestamps: true });

// Compound index for efficient per-user per-persona queries
aiMessageSchema.index({ sender: 1, persona: 1, createdAt: -1 });

export default mongoose.model('AIMessage', aiMessageSchema);
