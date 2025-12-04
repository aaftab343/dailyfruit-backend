import Plan from '../models/Plan.js';

export const getPlans = async (req, res) => {
  try {
    const { type, search } = req.query;
    const filter = { isActive: true };
    if (type) filter.type = type;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    const plans = await Plan.find(filter).sort({ price: 1 });
    res.json(plans);
  } catch (err) {
    console.error("getPlans error:", err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createPlan = async (req, res) => {
  try {
    const { name, slug, description, price, durationDays, imageUrl, type, isSeasonal, tags } = req.body;
    const exists = await Plan.findOne({ slug });
    if (exists) return res.status(400).json({ message: 'Slug already exists' });
    const plan = await Plan.create({
      name, slug, description, price, durationDays, imageUrl, type,
      isSeasonal: !!isSeasonal,
      tags: tags || []
    });
    res.status(201).json(plan);
  } catch (err) {
    console.error("createPlan error:", err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updatePlan = async (req, res) => {
  try {
    const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    res.json(plan);
  } catch (err) {
    console.error("updatePlan error:", err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deletePlan = async (req, res) => {
  try {
    const plan = await Plan.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    res.json({ message: 'Plan deleted' });
  } catch (err) {
    console.error("deletePlan error:", err.message);
    res.status(500).json({ message: 'Server error' });
  }
};
