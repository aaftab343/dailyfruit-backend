import mongoose from 'mongoose';

const addressDetailsSchema = new mongoose.Schema({
  house: String,
  street: String,
  area: String,
  city: String,
  pincode: String,
  full: String
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  address: { type: String },
  addressDetails: addressDetailsSchema,
  userType: { type: String, enum: ['home', 'office'], default: 'home' },
  offersOptIn: { type: Boolean, default: true },
  deliveryTime: { type: String, enum: ['morning', 'afternoon', 'evening'], default: 'morning' },
  role: { type: String, enum: ['user'], default: 'user' },
  referralCode: { type: String, unique: true, sparse: true },
  referralCount: { type: Number, default: 0 }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
