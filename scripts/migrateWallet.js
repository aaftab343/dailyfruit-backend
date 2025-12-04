import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Wallet from '../models/Wallet.js';

dotenv.config();

const run = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI not set');
      process.exit(1);
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to Mongo');

    const users = await User.find({});
    let created = 0;

    for (const user of users) {
      const existing = await Wallet.findOne({ userId: user._id });
      if (!existing) {
        await Wallet.create({ userId: user._id, balance: 0, transactions: [] });
        created++;
      }
    }

    console.log(`Wallet migration complete. New wallets created: ${created}`);
    process.exit(0);
  } catch (err) {
    console.error('migrateWallet error:', err.message);
    process.exit(1);
  }
};

run();
