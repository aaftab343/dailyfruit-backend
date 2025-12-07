import mongoose from "mongoose";

const deliveryScheduleSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription", required: true },
    mode: {
      type: String,
      enum: ["daily", "alternate", "weekdays"],
      default: "daily",
    },
    // skipDates: ['2025-12-25', ...]
    skipDates: [String],
  },
  { timestamps: true }
);

export default mongoose.model("DeliverySchedule", deliveryScheduleSchema);

