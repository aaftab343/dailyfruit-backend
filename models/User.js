import mongoose from "mongoose";

/* ==============================
   ADDRESS SUB-SCHEMA
============================== */
const addressSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      enum: ["Home", "Office", "Other"],
      default: "Home",
    },
    house: { type: String, required: true },
    street: { type: String, required: true },
    area: { type: String, required: true },
    city: { type: String, required: true },
    pincode: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false }
);

/* ==============================
   USER SCHEMA
============================== */
const userSchema = new mongoose.Schema(
  {
    /* BASIC INFO */
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    password: { type: String, required: true },

    /* ✅ MULTIPLE ADDRESSES (NEW) */
    addresses: {
      type: [addressSchema],
      default: [],
    },

    /* LEGACY FIELDS (KEEP – DO NOT REMOVE) */
    userType: {
      type: String,
      enum: ["home", "office"],
      default: "home",
    },

    offersOptIn: { type: Boolean, default: true },

    deliveryTime: {
      type: String,
      enum: ["morning", "afternoon", "evening"],
      default: "morning",
    },

    role: {
      type: String,
      enum: ["user"],
      default: "user",
    },

    referralCode: { type: String, unique: true, sparse: true },
    referralCount: { type: Number, default: 0 },

    /* ACTIVE SUBSCRIPTION */
    activeSubscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      default: null,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
