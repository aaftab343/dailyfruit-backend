import mongoose from 'mongoose';

const adminPasswordResetTokenSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  token: { type: String, required: true },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

const AdminPasswordResetToken = mongoose.model('AdminPasswordResetToken', adminPasswordResetTokenSchema);
export default AdminPasswordResetToken;
