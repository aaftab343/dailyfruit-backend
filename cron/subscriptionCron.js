import Subscription from '../models/Subscription.js';

export const markExpiredSubscriptions = async () => {
  const now = new Date();
  await Subscription.updateMany(
    { endDate: { $lt: now }, status: 'active' },
    { $set: { status: 'expired' } }
  );
};
