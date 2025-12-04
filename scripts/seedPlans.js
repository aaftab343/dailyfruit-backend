import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import Plan from '../models/Plan.js';

dotenv.config();

const plans = [
  { name: 'Weekly Fresh Bowl', slug: 'weekly-fresh-bowl', description: 'Fresh mixed fruit bowl delivered 5 days a week.', price: 424, durationDays: 7, type: 'weekly', tags: ['mixed', 'office'] },
  { name: 'Silver Monthly', slug: 'silver-monthly', description: 'Affordable monthly subscription.', price: 1274, durationDays: 30, type: 'monthly', tags: ['budget'] },
  { name: 'Gold Monthly', slug: 'gold-monthly', description: 'Premium monthly subscription.', price: 1869, durationDays: 30, type: 'monthly', tags: ['popular'] },
  { name: 'Diamond Monthly', slug: 'diamond-monthly', description: 'Top tier fruit experience.', price: 2549, durationDays: 30, type: 'monthly', tags: ['premium'] },
  { name: 'Weight Loss', slug: 'weight-loss', description: 'Low-calorie fat loss focused plan.', price: 1614, durationDays: 30, type: 'fitness', tags: ['fitness'] },
  { name: 'Weight Gain', slug: 'weight-gain', description: 'High calorie gain plan.', price: 1699, durationDays: 30, type: 'fitness', tags: ['fitness'] },
  { name: 'Fitness Pro', slug: 'fitness-pro', description: 'For serious lifters.', price: 2124, durationDays: 30, type: 'fitness', tags: ['gym'] },
  { name: 'Detox Cleanse', slug: 'detox-cleanse', description: 'Cleansing plan.', price: 1529, durationDays: 15, type: 'detox', tags: ['detox'] },
  { name: 'Immunity Boost', slug: 'immunity-boost', description: 'Vitamin rich plan.', price: 1869, durationDays: 30, type: 'health', tags: ['immunity'] },
  { name: 'Premium Custom', slug: 'premium-custom', description: 'Fully customized premium plan.', price: 2804, durationDays: 30, type: 'custom', tags: ['custom'] }
];

const run = async () => {
  try {
    await connectDB();
    await Plan.deleteMany();
    await Plan.insertMany(plans);
    console.log('✅ Plans seeded');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
};

run();
