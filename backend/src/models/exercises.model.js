import mongoose from 'mongoose';

const exerciseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  duration: { type: String, required: true },
  type: { type: String, required: true },
  color: { type: String },
  textColor: { type: String }
}, { timestamps: true });

export default mongoose.model('Exercise', exerciseSchema);
