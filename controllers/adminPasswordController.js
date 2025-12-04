import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import Admin from '../models/Admin.js';
import AdminPasswordResetToken from '../models/AdminPasswordResetToken.js';
import { sendEmail } from '../utils/sendEmail.js';

export const requestAdminPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const emailLower = (email || '').toLowerCase();
    const admin = await Admin.findOne({ email: emailLower });
    if (!admin) return res.status(400).json({ message: 'Admin not found' });

    await AdminPasswordResetToken.deleteMany({ adminId: admin._id });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await AdminPasswordResetToken.create({ adminId: admin._id, token, expiresAt });

    const url = `${process.env.FRONTEND_URL || ''}/admin-reset-password?token=${token}&id=${admin._id}`;
    const html = `<p>Reset your admin password: <a href="${url}">${url}</a></p>`;
    await sendEmail(admin.email, 'Daily Fruit Admin Password Reset', html);

    res.json({ message: 'Admin reset email sent' });
  } catch (err) {
    console.error("requestAdminPasswordReset error:", err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const resetAdminPassword = async (req, res) => {
  try {
    const { adminId, token, newPassword } = req.body;
    if (!adminId || !token || !newPassword) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const record = await AdminPasswordResetToken.findOne({ adminId, token });
    if (!record) return res.status(400).json({ message: 'Invalid or expired token' });
    if (record.expiresAt < new Date()) {
      await record.deleteOne();
      return res.status(400).json({ message: 'Token expired' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);
    await Admin.findByIdAndUpdate(adminId, { password: hashed });
    await record.deleteOne();

    res.json({ message: 'Admin password updated' });
  } catch (err) {
    console.error("resetAdminPassword error:", err.message);
    res.status(500).json({ message: 'Server error' });
  }
};
