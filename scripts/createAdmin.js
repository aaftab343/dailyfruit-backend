import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db.js';
import Admin from '../models/Admin.js';

dotenv.config();

const run = async () => {
  try {
    await connectDB();
    const email = process.env.DEFAULT_ADMIN_EMAIL;
    const password = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
    const name = process.env.DEFAULT_ADMIN_NAME || 'Super Admin';
    const role = process.env.DEFAULT_ADMIN_ROLE || 'superAdmin';

    if (!email) {
      console.log('Set DEFAULT_ADMIN_EMAIL in .env');
      process.exit(1);
    }

    const existing = await Admin.findOne({ email: email.toLowerCase() });
    if (existing) {
      console.log('Admin already exists');
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    await Admin.create({
      name,
      email: email.toLowerCase(),
      password: hashed,
      role
    });

    console.log('✅ Admin created');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Role:', role);
    process.exit(0);
  } catch (err) {
    console.error('createAdmin error:', err.message);
    process.exit(1);
  }
};

run();
