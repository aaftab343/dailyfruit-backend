import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  userName: String,

  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },

  planId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Plan', 
    required: true 
  },

  planName: String,

  amount: { type: Number, required: true },
  currency: { type: String, default: "INR" },

  status: { 
    type: String, 
    enum: ["created", "success", "failed", "manual"],
    default: "created"
  },

  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,

  // For future use
  paymentInfo: { type: Object, default: {} },

  // ⚡ Very important — prevents duplicate subscriptions
  processedForSubscription: { type: Boolean, default: false },

  // Link to created subscription
  subscriptionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Subscription", 
    default: null 
  },

  isOffline: { type: Boolean, default: false },

  notes: String

}, { timestamps: true });

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
