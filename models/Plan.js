// models/Plan.js
import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
  {
    // Plan name — e.g. "Weekly Fresh Bowl Plan"
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Slug — e.g. "weekly-fresh-bowl"
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // Short description
    description: {
      type: String,
      default: "",
      trim: true,
    },

    // Price in INR
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    // Subscription duration in days
    durationDays: {
      type: Number,
      default: 30,
    },

    // Optional plan image
    imageUrl: {
      type: String,
      default: "",
    },

    // Category (weekly, monthly, detox, premium, fitness)
    type: {
      type: String,
      default: "",
    },

    // Seasonal plan flag
    isSeasonal: {
      type: Boolean,
      default: false,
    },

    // Tags e.g. ["Bestseller", "Premium", "New"]
    tags: [
      {
        type: String,
        trim: true,
      }
    ],

    // ⭐ ACTIVE STATUS — IMPORTANT
    active: {
      type: Boolean,
      default: true,
    }
  },
  { timestamps: true }
);

const Plan = mongoose.model("Plan", planSchema);

export default Plan;
