import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import PasswordResetToken from '../models/PasswordResetToken.js';
import { sendEmail } from '../utils/sendEmail.js';

export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const emailLower = (email || '').toLowerCase();
    const user = await User.findOne({ email: emailLower });
    if (!user) return res.status(400).json({ message: 'User not found' });

    await PasswordResetToken.deleteMany({ userId: user._id });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await PasswordResetToken.create({ userId: user._id, token, expiresAt });

    const url = `${process.env.FRONTEND_URL || ''}/reset-password?token=${token}&id=${user._id}`;
    const html = `<p>Reset your password: <a href="${url}">${url}</a></p>`;
    await sendEmail(user.email, 'Daily Fruit Password Reset', html);

    res.json({ message: 'Reset email sent' });
  } catch (err) {
    console.error("requestPasswordReset error:", err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { userId, token, newPassword } = req.body;
    if (!userId || !token || !newPassword) {
      return res.status(400).json({ message: 'Missing fields' });
    }
    const record = await PasswordResetToken.findOne({ userId, token });
    if (!record) return res.status(400).json({ message: 'Invalid or expired token' });
    if (record.expiresAt < new Date()) {
      await record.deleteOne();
      return res.status(400).json({ message: 'Token expired' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);
    await User.findByIdAndUpdate(userId, { password: hashed });
    await record.deleteOne();

    res.json({ message: 'Password updated' });
  } catch (err) {
    console.error("resetPassword error:", err.message);
    res.status(500).json({ message: 'Server error' });
  }
};
