import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    /* =============================
       COUPON IDENTITY
    ============================== */

    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    /* =============================
       DISCOUNT CONFIG
    ============================== */

    discountType: {
      type: String,
      enum: ["flat", "percent"],
      required: true,
    },

    discountValue: {
      type: Number,
      required: true,
      min: 1,
    },

    minAmount: {
      type: Number,
      default: 0,
    },

    maxDiscount: {
      type: Number,
      default: null,
    },

    /* =============================
       VALIDITY
    ============================== */

    validFrom: {
      type: Date,
      default: Date.now,
    },

    validTo: {
      type: Date,
      required: true,
    },

    active: {
      type: Boolean,
      default: true,
    },

    /* =============================
       USAGE LIMITS
    ============================== */

    // ✅ FIX: REQUIRED, NO UNLIMITED
    usageLimit: {
      type: Number,
      required: true,
      min: 1,
    },

    perUserLimit: {
      type: Number,
      default: 1,
      min: 1,
    },

    totalUsed: {
      type: Number,
      default: 0,
      min: 0,
    },

    /* =============================
       APPLICABILITY
    ============================== */

    allowedPlanIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Plan",
      },
    ],
  },
  {
    timestamps: true,
  }
);

/* =============================
   INDEXES
============================== */
couponSchema.index({ code: 1 });
couponSchema.index({ active: 1 });
couponSchema.index({ validFrom: 1, validTo: 1 });

export default mongoose.model("Coupon", couponSchema);
