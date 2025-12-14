import Payment from "../models/Payment.js";

export const getAdminPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.json(
      payments.map(p => ({
        _id: p._id,
        userName: p.userId?.name || "-",
        txnId: p.razorpayPaymentId || p.paymentId || "-",
        amount: p.amount,
        status: p.status,
        invoiceId: p.invoiceId || null
      }))
    );
  } catch (err) {
    console.error("getAdminPayments error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};
