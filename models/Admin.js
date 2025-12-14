import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },

  role: {
    type: String,
    enum: [
      'SUPER_ADMIN',
      'MANAGER',
      'DELIVERY_ADMIN',
      'SUPPORT'
    ],
    default: 'SUPPORT'
  }

}, { timestamps: true });

const Admin = mongoose.model('Admin', adminSchema);
export default Admin;
