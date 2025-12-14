import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    /* =============================
       COUPON IDENTITY
    ============================== */

    // e.g. WELCOME200, DF10, SUMMER25
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    // Admin description / note
    description: {
      type: String,
      default: "",
      trim: true,
    },

    /* =============================
       DISCOUNT CONFIG
    ============================== */

    // flat = ₹200 | percent = 10%
    discountType: {
      type: String,
      enum: ["flat", "percent"],
      required: true,
    },

    // flat → amount | percent → %
    discountValue: {
      type: Number,
      required: true,
      min: 1,
    },

    // Minimum cart / plan price
    minAmount: {
      type: Number,
      default: 0,
    },

    // Max cap for percentage discount
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

    // Total coupon usage limit
    usageLimit: {
      type: Number,
      default: null, // null = unlimited
    },

    // How many times a single user can use this coupon
    perUserLimit: {
      type: Number,
      default: 1,
    },

    // Total usage count
    totalUsed: {
      type: Number,
      default: 0,
    },

    /* =============================
       APPLICABILITY
    ============================== */

    // Restrict coupon to specific plans (optional)
    allowedPlanIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Plan",
      },
    ],

    // Future-ready (if needed later)
    // allowedUserIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]

  },
  {
    timestamps: true,
  }
);

/* =============================
   INDEXES (Performance)
============================== */
couponSchema.index({ code: 1 });
couponSchema.index({ active: 1 });
couponSchema.index({ validFrom: 1, validTo: 1 });

export default mongoose.model("Coupon", couponSchema);
