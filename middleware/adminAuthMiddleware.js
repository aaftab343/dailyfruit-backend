import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

/**
 * Protect admin routes with role-based access
 */
export const protectAdmin = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
      }

      const token = authHeader.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const admin = await Admin.findById(decoded.id).select("-password");

      if (!admin) {
        return res.status(401).json({ message: "Admin not found" });
      }

      // Role check
      if (
        allowedRoles.length &&
        !allowedRoles.includes(admin.role)
      ) {
        return res.status(403).json({ message: "Access denied" });
      }

      req.admin = admin;
      next();
    } catch (err) {
      console.error("protectAdmin error:", err.message);
      return res.status(401).json({ message: "Invalid token" });
    }
  };
};

