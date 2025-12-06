import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },

    planName: { type: String, required: true },

    status: {
      type: String,
      enum: ["active", "paused", "cancelled", "expired"],
      default: "active",
    },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    // Auto-calculated for dashboard
    nextDeliveryDate: { type: Date },

    // e.g. ["Mon", "Tue", "Wed"]
    deliveryDays: {
      type: [String],
      default: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    },

    // Count how many bowls delivered
    totalDeliveries: { type: Number, default: 0 },

    // For pause system
    pausedAt: { type: Date },

    // For cancellation tracking
    cancelledAt: { type: Date },
  },
  { timestamps: true }
);

const Subscription = mongoose.model("Subscription", subscriptionSchema);
export default Subscription;
