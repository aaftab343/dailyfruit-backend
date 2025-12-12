import mongoose from "mongoose";

const deliverySchema = new mongoose.Schema(
  {
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      required: true
    },

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

    deliveryDate: {
      type: Date,
      required: true
    },

    status: {
      type: String,
      enum: [
        "pending",
        "scheduled",
        "out_for_delivery",
        "delivered",
        "missed",
        "cancelled",
        "skipped"
      ],
      default: "scheduled"
    },

    notes: { type: String },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryBoy",
      default: null
    },

    proofImage: String

  },
  { timestamps: true }
);

const Delivery = mongoose.model("Delivery", deliverySchema);
export default Delivery;
