// models/Plan.js
import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
  {
    // e.g. "Weekly Fresh Bowl Plan"
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // e.g. "weekly-fresh-bowl"
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    // e.g. 424
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    // default: 30 days subscription cycle
    durationDays: {
      type: Number,
      default: 30,
    },

    // Optional plan image
    imageUrl: {
      type: String,
      default: "",
    },

    // Category (weekly, monthly, premium, fitness, detox, etc.)
    type: {
      type: String,
      default: "",
    },

    // Seasonal plan flag
    isSeasonal: {
      type: Boolean,
      default: false,
    },

    // Tags shown in UI: ["Bestseller", "New", "Premium"]
    tags: [
      {
        type: String,
        trim: true,
      }
    ]
  },
  { timestamps: true }
);

const Plan = mongoose.model("Plan", planSchema);

export default Plan;
