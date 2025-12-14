import Delivery from "../models/Delivery.js";

export const getTodayDeliveries = async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const deliveries = await Delivery.find({
      deliveryDate: { $gte: start, $lte: end }
    })
      .populate("userId", "name email address")
      .sort({ createdAt: 1 });

    res.json(deliveries);
  } catch (err) {
    console.error("getTodayDeliveries error:", err.message);
    res.status(500).json({ message: "Failed to load deliveries" });
  }
};
