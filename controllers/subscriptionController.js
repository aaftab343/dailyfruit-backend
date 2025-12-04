import Subscription from '../models/Subscription.js';
import Plan from '../models/Plan.js';

export const getMySubscriptions = async (req, res) => {
  try {
    const subs = await Subscription.find({ userId: req.user._id }).populate('planId');
    res.json(subs);
  } catch (err) {
    console.error("getMySubscriptions error:", err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllSubscriptions = async (req, res) => {
  try {
    const { status, planId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (planId) filter.planId = planId;
    const subs = await Subscription.find(filter)
      .populate('userId', 'name email phone')
      .populate('planId', 'name price');
    res.json(subs);
  } catch (err) {
    console.error("getAllSubscriptions error:", err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateSubscriptionStatus = async (req, res) => {
  try {
    const sub = await Subscription.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!sub) return res.status(404).json({ message: 'Subscription not found' });
    res.json(sub);
  } catch (err) {
    console.error("updateSubscriptionStatus error:", err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const adminModifySubscription = async (req, res) => {
  try {
    const { newPlanId, extendDays, newEndDate } = req.body;
    const sub = await Subscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ message: 'Subscription not found' });

    if (newPlanId) {
      const plan = await Plan.findById(newPlanId);
      if (!plan) return res.status(400).json({ message: 'New plan not found' });
      sub.planId = plan._id;
      sub.planName = plan.name;
    }

    if (extendDays) {
      const extra = Number(extendDays) || 0;
      if (extra > 0) {
        sub.endDate = new Date(sub.endDate.getTime() + extra * 24 * 60 * 60 * 1000);
      }
    }

    if (newEndDate) {
      sub.endDate = new Date(newEndDate);
    }

    await sub.save();
    res.json(sub);
  } catch (err) {
    console.error("adminModifySubscription error:", err.message);
    res.status(500).json({ message: 'Server error' });
  }
};
