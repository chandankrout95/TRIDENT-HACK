import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  therapist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['earning', 'withdrawal'], required: true },
  status: { type: String, enum: ['completed', 'pending', 'failed'], default: 'completed' },
  description: { type: String },
  upiId: { type: String }, // Used for withdrawals
}, { timestamps: true });

export default mongoose.model('Transaction', transactionSchema);
