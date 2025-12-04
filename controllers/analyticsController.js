import User from '../models/User.js';
import Payment from '../models/Payment.js';
import Subscription from '../models/Subscription.js';

export const getBasicAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalUsers, totalSubs, activeSubs, totalRevenue, todayRevenue, monthRevenue] =
      await Promise.all([
        User.countDocuments({}),
        Subscription.countDocuments({}),
        Subscription.countDocuments({ status: 'active' }),
        Payment.aggregate([
          { $match: { status: 'success' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        Payment.aggregate([
          { $match: { status: 'success', createdAt: { $gte: startOfToday } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        Payment.aggregate([
          { $match: { status: 'success', createdAt: { $gte: startOfMonth } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ])
      ]);

    const sumAgg = (arr) => (arr[0]?.total || 0);

    res.json({
      totalUsers,
      totalSubscriptions: totalSubs,
      activeSubscriptions: activeSubs,
      totalRevenue: sumAgg(totalRevenue),
      todayRevenue: sumAgg(todayRevenue),
      monthRevenue: sumAgg(monthRevenue)
    });
  } catch (err) {
    console.error('getBasicAnalytics error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};
