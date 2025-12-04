import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendEmail } from '../utils/sendEmail.js';

const genToken = (id, role) => jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });

let loginOtpStore = {}; // { email: { otp, expiresAt } }

// SIGNUP
export const signup = async (req, res) => {
  try {
    const { name, email, phone, password, address } = req.body;
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'Name, email, phone, password required' });
    }
    const emailLower = email.toLowerCase();
    const emailExists = await User.findOne({ email: emailLower });
    if (emailExists) return res.status(400).json({ message: 'Email already registered' });
    const phoneExists = await User.findOne({ phone });
    if (phoneExists) return res.status(400).json({ message: 'Phone already registered' });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: emailLower,
      phone,
      password: hashed,
      address
    });

    const token = genToken(user._id, 'user');

    const html = `<h2>Welcome to Daily Fruit Co, ${user.name}</h2><p>Your account is ready.</p>`;
    sendEmail(user.email, 'Welcome to Daily Fruit Co', html);

    res.status(201).json({
      message: 'Signup successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address
      }
    });
  } catch (err) {
    console.error("signup error:", err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// PASSWORD LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const emailLower = (email || '').toLowerCase();
    const user = await User.findOne({ email: emailLower });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    const token = genToken(user._id, 'user');
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        addressDetails: user.addressDetails,
        userType: user.userType,
        offersOptIn: user.offersOptIn,
        deliveryTime: user.deliveryTime
      }
    });
  } catch (err) {
    console.error("login error:", err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// START EMAIL OTP LOGIN
export const startOtpLogin = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });
    const emailLower = email.toLowerCase();
    const user = await User.findOne({ email: emailLower });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiresAt = Date.now() + 5 * 60 * 1000;
    loginOtpStore[emailLower] = { otp, expiresAt };

    const html = `<p>Your Daily Fruit Co login OTP is <b>${otp}</b>. Valid for 5 minutes.</p>`;
    await sendEmail(emailLower, 'Daily Fruit Co Login OTP', html);

    res.json({ message: 'OTP sent to email' });
  } catch (err) {
    console.error("startOtpLogin error:", err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// VERIFY EMAIL OTP LOGIN
export const verifyOtpLogin = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const emailLower = (email || '').toLowerCase();
    const record = loginOtpStore[emailLower];
    if (!record) return res.status(400).json({ message: 'OTP not found or expired' });
    if (Date.now() > record.expiresAt) {
      delete loginOtpStore[emailLower];
      return res.status(400).json({ message: 'OTP expired' });
    }
    if (String(record.otp) != String(otp)) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    delete loginOtpStore[emailLower];

    const user = await User.findOne({ email: emailLower });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const token = genToken(user._id, 'user');
    res.json({
      message: 'OTP login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        addressDetails: user.addressDetails,
        userType: user.userType,
        offersOptIn: user.offersOptIn,
        deliveryTime: user.deliveryTime
      }
    });
  } catch (err) {
    console.error("verifyOtpLogin error:", err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMe = async (req, res) => {
  res.json({ user: req.user, role: req.userRole });
};
