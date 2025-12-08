// controllers/deliveryController.js
import Delivery from '../models/Delivery.js';
import Subscription from '../models/Subscription.js';
import Plan from '../models/Plan.js';

/* -----------------------------------------
   CREATE DELIVERY (ADMIN)
------------------------------------------ */
export const createDelivery = async (req, res) => {
  try {
    const {
      subscriptionId,
      userId,
      planId,
      deliveryDate,
      notes,
      assignedTo,
    } = req.body;

    if (!subscriptionId || !userId || !planId || !deliveryDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Prevent duplicate for the same user on same date
    const exists = await Delivery.findOne({
      userId,
      deliveryDate: new Date(deliveryDate),
    });

    if (exists) {
      return res
        .status(400)
        .json({ message: 'Delivery already exists for that date' });
    }

    const delivery = await Delivery.create({
      subscriptionId,
      userId,
      planId,
      deliveryDate,
      notes,
      assignedTo,
    });

    res.status(201).json(delivery);
  } catch (err) {
    console.error('createDelivery error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/* -----------------------------------------
   UPDATE DELIVERY STATUS (ADMIN)
------------------------------------------ */
export const updateDeliveryStatus = async (req, res) => {
  try {
    const { status, notes, assignedTo, proofImage } = req.body;

    const delivery = await Delivery.findByIdAndUpdate(
      req.params.id,
      { status, notes, assignedTo, proofImage },
      { new: true }
    );

    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    res.json(delivery);
  } catch (err) {
    console.error('updateDeliveryStatus error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/* -----------------------------------------
   GET ALL DELIVERIES (ADMIN)
------------------------------------------ */
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
      .populate('planId', 'name price')
      .populate('subscriptionId', 'status startDate endDate')
      .populate('assignedTo', 'name phone');

    res.json(deliveries);
  } catch (err) {
    console.error('getDeliveries error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/* -----------------------------------------
   GET MY DELIVERIES (CUSTOMER)
   (all deliveries: past + future)
------------------------------------------ */
export const getMyDeliveries = async (req, res) => {
  try {
    const deliveries = await Delivery.find({
      userId: req.user._id,
    }).sort({ deliveryDate: -1 });

    res.json(deliveries);
  } catch (err) {
    console.error('getMyDeliveries error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/* -----------------------------------------
   GET MY UPCOMING DELIVERIES (next 7 days)
   used by: GET /api/deliveries/upcoming
------------------------------------------ */
export const getMyUpcomingDeliveries = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const in7 = new Date(today);
    in7.setDate(in7.getDate() + 7);

    const deliveries = await Delivery.find({
      userId: req.user._id,
      deliveryDate: { $gte: today, $lte: in7 },
    }).sort({ deliveryDate: 1 });

    res.json(deliveries);
  } catch (err) {
    console.error('getMyUpcomingDeliveries error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/* -----------------------------------------
   GET MY DELIVERY HISTORY (past deliveries)
   used by: GET /api/deliveries/history
------------------------------------------ */
export const getMyDeliveryHistory = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deliveries = await Delivery.find({
      userId: req.user._id,
      deliveryDate: { $lt: today },
    }).sort({ deliveryDate: -1 });

    res.json(deliveries);
  } catch (err) {
    console.error('getMyDeliveryHistory error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/* -----------------------------------------
   SKIP A DELIVERY (CUSTOMER)
   used by: POST /api/deliveries/skip/:id
------------------------------------------ */
export const skipMyDelivery = async (req, res) => {
  try {
    const { id } = req.params;

    const delivery = await Delivery.findById(id);
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    // Ensure user owns this delivery (unless admin)
    const role = req.user?.role;
    const isAdmin =
      role && ['superAdmin', 'admin', 'staffAdmin'].includes(role);

    if (!isAdmin && delivery.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    delivery.status = 'skipped';
    await delivery.save();

    res.json({ message: 'Delivery skipped', delivery });
  } catch (err) {
    console.error('skipMyDelivery error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
