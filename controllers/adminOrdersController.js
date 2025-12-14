import Subscription from "../models/Subscription.js";

export const getAdminOrders = async (req, res) => {
  try {
    const orders = await Subscription.find()
      .populate("user", "name email phone address")
      .populate("plan", "name price")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error("getAdminOrders error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

