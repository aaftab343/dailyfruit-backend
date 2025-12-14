import User from "../models/User.js";
import Payment from "../models/Payment.js";
import Subscription from "../models/Subscription.js";
import Delivery from "../models/Delivery.js";

export const getDashboardStats = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const monthStart = new Date(
      todayStart.getFullYear(),
      todayStart.getMonth(),
      1
    );

    const [
      ordersToday,
      ordersMonth,
      revenueTodayAgg,
      revenueMonthAgg
    ] = await Promise.all([
      Subscription.countDocuments({ createdAt: { $gte: todayStart } }),
      Subscription.countDocuments({ createdAt: { $gte: monthStart } }),

      Payment.aggregate([
        { $match: { status: "success", createdAt: { $gte: todayStart } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),

      Payment.aggregate([
        { $match: { status: "success", createdAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ])
    ]);

    res.json({
      ordersToday,
      ordersMonth,
      revenueToday: revenueTodayAgg[0]?.total || 0,
      revenueMonth: revenueMonthAgg[0]?.total || 0,
      alerts: [],
      graph: []
    });
  } catch (err) {
    console.error("getDashboardStats error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

/* ---------------- USERS ---------------- */

export const getAllUsers = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } }
      ];
    }

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (err) {
    console.error("getAllUsers error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, phone },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    console.error("updateUser error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    console.error("deleteUser error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};
