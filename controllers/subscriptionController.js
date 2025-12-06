// controllers/subscriptionController.js
import Subscription from "../models/Subscription.js";
import Plan from "../models/Plan.js";

/* -----------------------------------------
   GET ALL MY SUBSCRIPTIONS
------------------------------------------ */
export const getMySubscriptions = async (req, res) => {
  try {
    const subs = await Subscription.find({ userId: req.user._id })
      .populate("planId");

    res.json(subs);
  } catch (err) {
    console.error("getMySubscriptions:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* -----------------------------------------
   GET MY ACTIVE SUBSCRIPTION
------------------------------------------ */
export const getMyActiveSubscription = async (req, res) => {
  try {
    const sub = await Subscription.findOne({
      userId: req.user._id,
      status: "active"
    }).populate("planId");

    if (!sub) return res.json(null);

    res.json(sub);
  } catch (err) {
    console.error("getMyActiveSubscription:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* -----------------------------------------
   GET MY SUBSCRIPTION HISTORY
------------------------------------------ */
export const getMySubscriptionHistory = async (req, res) => {
  try {
    const history = await Subscription.find({
      userId: req.user._id,
      status: { $in: ["expired", "cancelled"] }
    }).populate("planId");

    res.json(history);
  } catch (err) {
    console.error("getMySubscriptionHistory:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* -----------------------------------------
   ADMIN — GET ALL SUBSCRIPTIONS
------------------------------------------ */
export const getAllSubscriptions = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.planId) filter.planId = req.query.planId;

    const subs = await Subscription.find(filter)
      .populate("userId", "name email phone")
      .populate("planId", "name price");

    res.json(subs);
  } catch (err) {
    console.error("getAllSubscriptions:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* -----------------------------------------
   ADMIN — UPDATE STATUS
------------------------------------------ */
export const updateSubscriptionStatus = async (req, res) => {
  try {
    const sub = await Subscription.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    if (!sub) return res.status(404).json({ message: "Subscription not found" });

    res.json(sub);
  } catch (err) {
    console.error("updateSubscriptionStatus:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* -----------------------------------------
   ADMIN — MODIFY SUBSCRIPTION
------------------------------------------ */
export const adminModifySubscription = async (req, res) => {
  try {
    const { newPlanId, extendDays, newEndDate } = req.body;

    const sub = await Subscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ message: "Subscription not found" });

    if (newPlanId) {
      const plan = await Plan.findById(newPlanId);
      if (!plan) return res.status(400).json({ message: "New plan not found" });

      sub.planId = plan._id;
      sub.planName = plan.name;
    }

    if (extendDays) {
      const extra = Number(extendDays);
      if (extra > 0) {
        sub.endDate = new Date(
          sub.endDate.getTime() + extra * 24 * 60 * 60 * 1000
        );
      }
    }

    if (newEndDate) {
      sub.endDate = new Date(newEndDate);
    }

    await sub.save();
    res.json(sub);
  } catch (err) {
    console.error("adminModifySubscription:", err);
    res.status(500).json({ message: "Server error" });
  }
};
