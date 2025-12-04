import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
  planName: String,
  status: { type: String, enum: ['active', 'expired', 'cancelled', 'paused'], default: 'active' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  nextDeliveryDate: Date,
  totalDeliveries: { type: Number, default: 0 }
}, { timestamps: true });

const Subscription = mongoose.model('Subscription', subscriptionSchema);
export default Subscription;
