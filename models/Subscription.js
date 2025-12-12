import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },

  planId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Plan", 
    required: true 
  },

  planName: { type: String, required: true },

  status: {
    type: String,
    enum: ["active", "paused", "cancelled", "expired"],
    default: "active"
  },

  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },

  nextDeliveryDate: { type: Date },

  deliveryDays: {
    type: [String],
    default: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  },

  totalDeliveries: { type: Number, default: 0 },
  remainingDeliveries: { type: Number, default: 0 },

  pausedAt: { type: Date },
  pausedUntil: { type: Date },
  cancelledAt: { type: Date },

  autoRenew: { type: Boolean, default: true },

  deliveryMode: {
    type: String,
    enum: ["daily", "alternate", "weekdays"],
    default: "daily"
  },

  skipDates: { type: [String], default: [] },

  // ⭐ Ties subscription back to payment
  originatingPaymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Payment",
    default: null
  }

}, { timestamps: true });

const Subscription = mongoose.model("Subscription", subscriptionSchema);
export default Subscription;
