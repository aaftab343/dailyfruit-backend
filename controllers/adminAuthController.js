import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

const genToken = (id, role) => jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const emailLower = (email || '').toLowerCase();
    const admin = await Admin.findOne({ email: emailLower });
    if (!admin) return res.status(400).json({ message: 'Invalid credentials' });
    const match = await bcrypt.compare(password, admin.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });
    const token = genToken(admin._id, admin.role);
    res.json({
      message: 'Admin login successful',
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (err) {
    console.error("adminLogin error:", err.message);
    res.status(500).json({ message: 'Server error' });
  }
};
