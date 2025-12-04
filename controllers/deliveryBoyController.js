import bcrypt from 'bcryptjs';
import DeliveryBoy from '../models/DeliveryBoy.js';

export const deliveryBoyRegister = async (req, res) => {
  try {
    const { name, phone, password, pinCode, citySlug } = req.body;
    if (!name || !phone || !password) {
      return res.status(400).json({ message: 'Name, phone, password are required' });
    }
    const existing = await DeliveryBoy.findOne({ phone });
    if (existing) return res.status(400).json({ message: 'Phone already registered' });
    const passwordHash = await bcrypt.hash(password, 10);
    const boy = await DeliveryBoy.create({ name, phone, passwordHash, pinCode, citySlug });
    res.status(201).json({ _id: boy._id, name: boy.name, phone: boy.phone });
  } catch (err) {
    console.error('deliveryBoyRegister error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deliveryBoyLogin = async (req, res) => {
  try {
    const { phone, password } = req.body;
    const boy = await DeliveryBoy.findOne({ phone });
    if (!boy) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, boy.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    boy.lastLoginAt = new Date();
    await boy.save();
    res.json({ _id: boy._id, name: boy.name, phone: boy.phone });
  } catch (err) {
    console.error('deliveryBoyLogin error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const adminListDeliveryBoys = async (req, res) => {
  try {
    const list = await DeliveryBoy.find({}).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    console.error('adminListDeliveryBoys error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};
