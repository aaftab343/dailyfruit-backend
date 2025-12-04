import Delivery from '../models/Delivery.js';

export const createDelivery = async (req, res) => {
  try {
    const { subscriptionId, userId, planId, deliveryDate, notes, assignedTo } = req.body;
    const delivery = await Delivery.create({ subscriptionId, userId, planId, deliveryDate, notes, assignedTo });
    res.status(201).json(delivery);
  } catch (err) {
    console.error("createDelivery error:", err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateDeliveryStatus = async (req, res) => {
  try {
    const { status, notes, assignedTo } = req.body;
    const delivery = await Delivery.findByIdAndUpdate(
      req.params.id,
      { status, notes, assignedTo },
      { new: true }
    );
    if (!delivery) return res.status(404).json({ message: 'Delivery not found' });
    res.json(delivery);
  } catch (err) {
    console.error("updateDeliveryStatus error:", err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getDeliveries = async (req, res) => {
  try {
    const { date, status, assignedTo } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (date) {
      const d = new Date(date);
      const next = new Date(d);
      next.setDate(d.getDate() + 1);
      filter.deliveryDate = { $gte: d, $lt: next };
    }
    const deliveries = await Delivery.find(filter)
      .populate('userId', 'name email phone')
      .populate('planId', 'name')
      .populate('subscriptionId', '_id');
    res.json(deliveries);
  } catch (err) {
    console.error("getDeliveries error:", err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMyDeliveries = async (req, res) => {
  try {
    const deliveries = await Delivery.find({ userId: req.user._id }).sort({ deliveryDate: -1 });
    res.json(deliveries);
  } catch (err) {
    console.error("getMyDeliveries error:", err.message);
    res.status(500).json({ message: 'Server error' });
  }
};
