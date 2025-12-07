// controllers/planController.js
import Plan from "../models/Plan.js";

/**
 * GET /api/plans
 * Public – list active plans, with optional filters.
 * Query:
 *   - type=weekly/monthly/premium/...
 *   - search=keyword (search name + description)
 */
export const getPlans = async (req, res) => {
  try {
    const { type, search } = req.query;

    // Only active plans
    const filter = { active: true };

    if (type) {
      filter.type = type;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const plans = await Plan.find(filter).sort({ price: 1 });
    res.json(plans);
  } catch (err) {
    console.error("getPlans error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /api/plans
 * Admin / SuperAdmin – create plan
 */
export const createPlan = async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      price,
      durationDays,
      imageUrl,
      type,
      isSeasonal,
      tags,
      active,
    } = req.body;

    if (!name || !slug || price == null) {
      return res
        .status(400)
        .json({ message: "name, slug and price are required" });
    }

    const exists = await Plan.findOne({ slug });
    if (exists) {
      return res.status(400).json({ message: "Slug already exists" });
    }

    const plan = await Plan.create({
      name,
      slug,
      description: description || "",
      price,
      durationDays: durationDays || 30,
      imageUrl: imageUrl || "",
      type: type || "",
      isSeasonal: !!isSeasonal,
      tags: tags || [],
      active: active !== undefined ? !!active : true,
    });

    res.status(201).json(plan);
  } catch (err) {
    console.error("createPlan error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * PUT /api/plans/:id
 * Admin / SuperAdmin – update plan
 */
export const updatePlan = async (req, res) => {
  try {
    const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    res.json(plan);
  } catch (err) {
    console.error("updatePlan error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * DELETE /api/plans/:id
 * SuperAdmin – delete plan
 */
export const deletePlan = async (req, res) => {
  try {
    const plan = await Plan.findByIdAndDelete(req.params.id);

    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    res.json({ message: "Plan deleted" });
  } catch (err) {
    console.error("deletePlan error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};
