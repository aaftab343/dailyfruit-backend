import Payment from "../models/Payment.js";

export const getAdminPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .sort({ createdAt: -1 })
      .limit(200);

    res.json(payments);
  } catch (err) {
    console.error("getAdminPayments error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};
