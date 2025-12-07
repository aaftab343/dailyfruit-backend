// utils/deliveryGenerator.js
import Delivery from "../models/Delivery.js";

/**
 * Auto Generate Deliveries for a subscription
 * ------------------------------------------------
 * Rules:
 *  - 30 days schedule
 *  - Skip Sundays automatically
 *  - If paused → STOP generating
 *  - If resumed → restart generation from today
 */

export const generateDeliveriesForSubscription = async (subscription, plan) => {
  try {
    const userId = subscription.userId;
    const planId = plan._id;
    const subscriptionId = subscription._id;

    const startDate = new Date(subscription.startDate);
    let daysCreated = 0;

    for (let i = 0; i < 40; i++) { 
      if (daysCreated >= 30) break;

      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);

      // Skip Sundays
      if (d.getDay() === 0) continue;

      // Do NOT generate deliveries for paused subscription
      if (subscription.status === "paused") break;

      // Prevent duplicates
      const alreadyExists = await Delivery.findOne({
        subscriptionId,
        deliveryDate: {
          $gte: new Date(d.setHours(0,0,0,0)),
          $lte: new Date(d.setHours(23,59,59,999))
        }
      });

      if (alreadyExists) continue;

      await Delivery.create({
        subscriptionId,
        userId,
        planId,
        deliveryDate: new Date(d),
        status: "scheduled",
      });

      daysCreated++;
    }

    return { success: true, message: `Generated ${daysCreated} deliveries.` };

  } catch (err) {
    console.error("AUTO-DELIVERY-GENERATOR ERROR:", err);
    return { success: false };
  }
};
