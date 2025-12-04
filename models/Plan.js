import mongoose from 'mongoose';

const planSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: String,
  price: { type: Number, required: true },
  durationDays: { type: Number, required: true },
  imageUrl: String,
  isActive: { type: Boolean, default: true },
  type: String,
  isSeasonal: { type: Boolean, default: false },
  tags: [String]
}, { timestamps: true });

const Plan = mongoose.model('Plan', planSchema);
export default Plan;
