import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

/**
 * Generate JWT token
 * Payload includes admin id + role
 */
const genToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

/**
 * ADMIN LOGIN
 * POST /api/admin/auth/login
 */
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // Normalize email
    const emailLower = email.toLowerCase();

    // Find admin
    const admin = await Admin.findOne({ email: emailLower });
    if (!admin) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate token
    const token = genToken(admin._id, admin.role);

    // ✅ IMPORTANT: role is returned at TOP LEVEL
    return res.json({
      message: "Admin login successful",
      token,
      role: admin.role, // 🔴 REQUIRED for frontend RBAC
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        createdAt: admin.createdAt
      }
    });

  } catch (error) {
    console.error("adminLogin error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
