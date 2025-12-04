import crypto from 'crypto';
import Payment from '../models/Payment.js';

export const razorpayWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];
    const body = req.rawBody || JSON.stringify(req.body);

    const expected = crypto.createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (expected !== signature) {
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const event = req.body.event;
    if (event === 'payment.failed') {
      const entity = req.body.payload.payment.entity;
      await Payment.findOneAndUpdate(
        { razorpayOrderId: entity.order_id },
        { status: 'failed' }
      );
    }

    res.json({ status: 'ok' });
  } catch (err) {
    console.error("razorpayWebhook error:", err.message);
    res.status(500).json({ message: 'Server error' });
  }
};
