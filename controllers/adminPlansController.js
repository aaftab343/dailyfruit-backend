import Plan from "../models/Plan.js";

export const getAdminPlans = async (req, res) => {
  try {
    const plans = await Plan.find().sort({ createdAt: -1 });
    res.json(plans);
  } catch (err) {
    res.status(500).json({ message: "Failed to load plans" });
  }
};

export const togglePlanStatus = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: "Plan not found" });

    plan.active = !plan.active;
    await plan.save();

    res.json({ message: "Plan updated", plan });
  } catch (err) {
    res.status(500).json({ message: "Failed to update plan" });
  }
};
