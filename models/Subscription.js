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

    // Next delivery auto-calc
    nextDeliveryDate: { type: Date },

    // Weekly delivery days
    deliveryDays: {
      type: [String],
      default: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    },

    totalDeliveries: { type: Number, default: 0 },

    // Pause system
    pausedAt: { type: Date },
    pausedUntil: { type: Date },

    // Cancellation
    cancelledAt: { type: Date },

    // Auto renewal
    autoRenew: { type: Boolean, default: true },

    // Delivery schedule mode
    deliveryMode: {
      type: String,
      enum: ["daily", "alternate", "weekdays"],
      default: "daily",
    },

    // Skip specific days
    skipDates: { type: [String], default: [] },
  },
  { timestamps: true }
);

const Subscription = mongoose.model("Subscription", subscriptionSchema);
export default Subscription;
