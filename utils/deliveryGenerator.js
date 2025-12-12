// utils/deliveryGenerator.js
import Delivery from "../models/Delivery.js";

/**
 * generateDeliveriesForSubscription
 *
 * Params (single object):
 *  - subscription: subscription document (must contain _id, userId, startDate, status)
 *  - plan: plan document (used to read deliveryDays, deliveryCount / billingDaysPerMonth / durationDays)
 *  - options (optional):
 *     - totalDeliveriesOverride: number (if you want to override plan count)
 *     - maxLookAheadDays: safety upper bound (default 400)
 *
 * Returns:
 *  { insertedCount: Number, firstDelivery: Date | null, datesPlanned: [Date] }
 *
 * Notes:
 *  - Creates documents with both `date` and `deliveryDate` to be compatible with different schemas.
 *  - Skips Sundays unless allowedDays includes 'Sun'.
 *  - If subscription.startDate is in the past, generation starts from today (resume behavior).
 */
export async function generateDeliveriesForSubscription({ subscription, plan, options = {} }) {
  try {
    if (!subscription || !plan) {
      throw new Error("subscription and plan required");
    }

    // Resolve config
    const totalDeliveries =
      options.totalDeliveriesOverride ||
      plan.deliveryCount ||
      plan.billingDaysPerMonth ||
      plan.durationDays ||
      26;

    const allowedDays = Array.isArray(plan.deliveryDays) && plan.deliveryDays.length
      ? plan.deliveryDays.map(d => String(d).slice(0,3)) // normalize like 'Mon'
      : ['Mon','Tue','Wed','Thu','Fri','Sat'];

    const maxLookAheadDays = Number(options.maxLookAheadDays || 400);

    // convert allowedDays to numeric weekdays
    const DAY_NUM = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 };
    const allowedSet = new Set(allowedDays.map(d => DAY_NUM[d]));

    // choose start cursor: if subscription.startDate is before today, use today (resume)
    const today = new Date();
    today.setHours(0,0,0,0);

    let cursor = subscription.startDate ? new Date(subscription.startDate) : new Date();
    cursor.setHours(0,0,0,0);
    if (cursor < today) cursor = new Date(today);

    // generate candidate dates (will stop when we've collected totalDeliveries or hit lookahead)
    const candidates = [];
    for (let i = 0; i < maxLookAheadDays && candidates.length < totalDeliveries; i++) {
      const dt = new Date(cursor);
      dt.setDate(cursor.getDate() + i);

      // if subscription is paused, stop generating
      if (subscription.status === "paused" || subscription.status === "cancelled") break;

      const weekday = dt.getDay(); // 0..6
      if (!allowedSet.has(weekday)) continue; // skip disallowed days (e.g., Sunday)

      // Only schedule from today onwards (cursor already ensures this)
      candidates.push(new Date(dt));
    }

    if (!candidates.length) {
      return { insertedCount: 0, firstDelivery: null, datesPlanned: [] };
    }

    // Query existing deliveries for these dates to avoid duplicates.
    // Build date ranges array for $or query
    const ranges = candidates.map(d => {
      const startOfDay = new Date(d);
      startOfDay.setHours(0,0,0,0);
      const endOfDay = new Date(d);
      endOfDay.setHours(23,59,59,999);
      return { date: { $gte: startOfDay, $lte: endOfDay } }; // `date` field
    });

    // Also include alternative field name 'deliveryDate' in case schema uses that
    const altRanges = candidates.map(d => {
      const startOfDay = new Date(d);
      startOfDay.setHours(0,0,0,0);
      const endOfDay = new Date(d);
      endOfDay.setHours(23,59,59,999);
      return { deliveryDate: { $gte: startOfDay, $lte: endOfDay } }; // `deliveryDate` field
    });

    // Find existing docs matching subscriptionId & any of the date ranges
    const existingQuery = {
      subscriptionId: subscription._id,
      $or: [...ranges, ...altRanges]
    };

    const existing = await Delivery.find(existingQuery, { date: 1, deliveryDate: 1 }).lean();

    // Build a set of ISO date strings of already-created days (normalized date)
    const existingSet = new Set(
      existing.map(doc => {
        const d = doc.date || doc.deliveryDate;
        if (!d) return null;
        const x = new Date(d);
        x.setHours(0,0,0,0);
        return x.toISOString();
      }).filter(Boolean)
    );

    // Filter candidates to exclude existing days
    const toInsertDates = candidates.filter(d => {
      const key = (new Date(d)).toISOString();
      return !existingSet.has(key);
    });

    if (!toInsertDates.length) {
      // nothing new to insert
      const firstDelivery = candidates.length ? candidates[0] : null;
      return { insertedCount: 0, firstDelivery, datesPlanned: candidates };
    }

    // Prepare docs for bulk insert. Include both 'date' and 'deliveryDate' for compatibility.
    const docs = toInsertDates.map(d => ({
      subscriptionId: subscription._id,
      userId: subscription.userId,
      planId,
      date: d,
      deliveryDate: d,
      status: 'scheduled',
      assignedTo: null,
      notes: '',
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    const inserted = await Delivery.insertMany(docs, { ordered: true });

    const insertedCount = Array.isArray(inserted) ? inserted.length : 0;
    const firstDelivery = candidates.length ? candidates[0] : (insertedCount ? toInsertDates[0] : null);

    return { insertedCount, firstDelivery, datesPlanned: candidates };
  } catch (err) {
    console.error("generateDeliveriesForSubscription error:", err);
    return { insertedCount: 0, firstDelivery: null, datesPlanned: [], error: err.message };
  }
}

export default generateDeliveriesForSubscription;
