import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  house: { type: String, required: true },
  street: { type: String, required: true },
  area: { type: String, required: true },
  city: { type: String, required: true },
  pincode: { type: String, required: true },
  full: { type: String }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },

  email: { type: String, required: true, unique: true, lowercase: true },

  phone: { type: String, required: true, unique: true },

  password: { type: String, required: true },

  address: addressSchema,

  userType: { type: String, enum: ["home", "office"], default: "home" },

  offersOptIn: { type: Boolean, default: true },

  deliveryTime: { 
    type: String, 
    enum: ["morning", "afternoon", "evening"], 
    default: "morning" 
  },

  role: { type: String, enum: ["user"], default: "user" },

  referralCode: { type: String, unique: true, sparse: true },
  referralCount: { type: Number, default: 0 },

  // ⭐ Required for showing active plan in dashboard
  activeSubscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subscription",
    default: null
  }

}, { timestamps: true });

const User = mongoose.model("User", userSchema);
export default User;
