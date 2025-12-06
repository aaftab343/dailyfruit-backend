// controllers/subscriptionController.js
import Subscription from "../models/Subscription.js";
import Plan from "../models/Plan.js";

/* ============================================================
   1) GET ACTIVE SUBSCRIPTION OF LOGGED-IN USER
   Route: GET /api/subscriptions/my-active
   Access: User
============================================================ */
export const getMyActiveSubscription = async (req, res) => {
  try {
    const sub = await Subscription.findOne({
      userId: req.user._id,
      status: { $in: ["active", "paused"] }
    }).populate("planId");

    if (!sub) {
      return res.json({ active: false, subscription: null });
    }

    res.json({
      active: true,
      subscription: {
        id: sub._id,
        name: sub.planName,
        price: sub.planId?.price || null,
        status: sub.status,
        startDate: sub.startDate,
        endDate: sub.endDate,
        nextDeliveryDate: sub.nextDeliveryDate
      }
    });
  } catch (err) {
    console.error("getMyActiveSubscription:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   2) GET SUBSCRIPTION HISTORY FOR LOGGED-IN USER
   Route: GET /api/subscriptions/history
   Access: User
============================================================ */
export const getMySubscriptionHistory = async (req, res) => {
  try {
    const subs = await Subscription.find({
      userId: req.user._id
    })
      .sort({ createdAt: -1 })
      .populate("planId", "name price slug");

    res.json(subs);
  } catch (err) {
    console.error("getMySubscriptionHistory:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   3) ADMIN: FETCH ALL SUBSCRIPTIONS
   Route: GET /api/subscriptions
   Access: Admin, SuperAdmin
============================================================ */
export const getAllSubscriptions = async (req, res) => {
  try {
    const { status, planId } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (planId) filter.planId = planId;

    const subs = await Subscription.find(filter)
      .populate("userId", "name email phone")
      .populate("planId", "name price slug")
      .sort({ createdAt: -1 });

    res.json(subs);
  } catch (err) {
    console.error("getAllSubscriptions error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   4) ADMIN: UPDATE SUBSCRIPTION STATUS (pause/resume/cancel)
   Route: PUT /api/subscriptions/:id/status
   Access: Admin, SuperAdmin
============================================================ */
export const updateSubscriptionStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const update = await Subscription.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!update) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    res.json(update);
  } catch (err) {
    console.error("updateSubscriptionStatus:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   5) ADMIN: MODIFY SUBSCRIPTION
      - Change plan
      - Extend days
      - Set custom end date
   Route: PUT /api/subscriptions/:id/modify
   Access: Admin, SuperAdmin
============================================================ */
export const adminModifySubscription = async (req, res) => {
  try {
    const { newPlanId, extendDays, newEndDate } = req.body;

    const sub = await Subscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ message: "Subscription not found" });

    // Change plan
    if (newPlanId) {
      const plan = await Plan.findById(newPlanId);
      if (!plan) return res.status(400).json({ message: "New plan not found" });

      sub.planId = plan._id;
      sub.planName = plan.name;
    }

    // Extend days
    if (extendDays) {
      const extra = Number(extendDays);
      if (extra > 0) {
        sub.endDate = new Date(sub.endDate.getTime() + extra * 86400000);
      }
    }

    // Set custom end date
    if (newEndDate) {
      sub.endDate = new Date(newEndDate);
    }

    await sub.save();
    res.json(sub);
  } catch (err) {
    console.error("adminModifySubscription error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};
