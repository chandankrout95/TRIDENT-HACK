import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: String, required: true },
  size: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model('Report', reportSchema);
