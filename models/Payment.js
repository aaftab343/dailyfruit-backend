import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  userName: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan' },
  planName: String,
  amount: { type: Number, required: true },
  status: { type: String, enum: ['created', 'success', 'failed', 'manual'], default: 'created' },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  isOffline: { type: Boolean, default: false },
  notes: String
}, { timestamps: true });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
