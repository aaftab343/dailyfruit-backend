import mongoose from 'mongoose';

const deliverySchema = new mongoose.Schema({
  subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
  deliveryDate: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'delivered', 'skipped'], default: 'pending' },
  notes: String,
  assignedTo: String
}, { timestamps: true });

const Delivery = mongoose.model('Delivery', deliverySchema);
export default Delivery;
