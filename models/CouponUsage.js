import mongoose from "mongoose";

const couponUsageSchema = new mongoose.Schema(
  {
    // Which coupon was used
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      required: true,
      index: true,
    },

    // Which user used it
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // How many times this user has used this coupon
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Last time used (optional, useful for audits)
    lastUsedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/* =============================
   COMPOSITE UNIQUE INDEX
   (One document per user per coupon)
============================== */
couponUsageSchema.index(
  { couponId: 1, userId: 1 },
  { unique: true }
);

export default mongoose.model("CouponUsage", couponUsageSchema);
