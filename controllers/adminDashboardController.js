import User from '../models/User.js';
import Payment from '../models/Payment.js';
import Subscription from '../models/Subscription.js';
import Delivery from '../models/Delivery.js';

export const getDashboardStats = async (req, res) => {
  try {
    const [users, activeSubs, revenueAgg, deliveriesToday] = await Promise.all([
      User.countDocuments(),
      Subscription.countDocuments({ status: 'active' }),
      Payment.aggregate([
        { $match: { status: { $in: ['success', 'manual'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Delivery.countDocuments({
        deliveryDate: {
          $gte: new Date(new Date().setHours(0,0,0,0)),
          $lt: new Date(new Date().setHours(23,59,59,999))
        }
      })
    ]);

    res.json({
      totalUsers: users,
      activeSubscriptions: activeSubs,
      totalRevenue: revenueAgg[0]?.total || 0,
      todayDeliveries: deliveriesToday
    });
  } catch (err) {
    console.error("getDashboardStats error:", err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error("getAllUsers error:", err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, phone },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error("updateUser error:", err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error("deleteUser error:", err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPayments = async (req, res) => {
  try {
    const { status, from, to, email } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (email) filter.userEmail = { $regex: email, $options: 'i' };
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23,59,59,999);
        filter.createdAt.$lte = end;
      }
    }
    const payments = await Payment.find(filter).sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    console.error("getPayments error:", err.message);
    res.status(500).json({ message: 'Server error' });
  }
};
