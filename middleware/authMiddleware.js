import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Admin from '../models/Admin.js';

export const protect = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Not authorized, no token' });
      }
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      let doc = null;
      if (decoded.role === 'user') {
        doc = await User.findById(decoded.id).select('-password');
      } else if (['superAdmin', 'admin', 'staffAdmin'].includes(decoded.role)) {
        doc = await Admin.findById(decoded.id).select('-password');
      }

      if (!doc) {
        return res.status(401).json({ message: 'User not found' });
      }

      if (allowedRoles.length && !allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      req.user = doc;
      req.userRole = decoded.role;
      next();
    } catch (err) {
      console.error("auth error:", err.message);
      return res.status(401).json({ message: 'Not authorized' });
    }
  };
};
