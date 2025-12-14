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

  amount: { type: Number, required: true },           // FINAL PAID AMOUNT
  currency: { type: String, default: "INR" },

  // ✅ NEW (locked coupon info)
  coupon: {
    couponId: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon" },
    code: String,
    discount: Number,
    originalAmount: Number
  },

  status: { 
    type: String, 
    enum: ["created", "success", "failed", "manual"],
    default: "created"
  },

  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,

  paymentInfo: { type: Object, default: {} },

  processedForSubscription: { type: Boolean, default: false },

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
