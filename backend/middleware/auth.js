const { verifyToken } = require('../utils/jwtUtils');
const User = require('../models/User');

/**
 * Middleware to verify JWT token and load full user from DB.
 * Attaches userId, role, classroomId, name, email to req.user.
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'No authorization token provided',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization header format',
      });
    }

    const decoded = verifyToken(token);

    // Fetch full user so downstream controllers have classroomId, name, etc.
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive',
      });
    }

    req.user = {
      userId: user._id,
      role: user.role,
      classroomId: user.classroomId,
      name: user.name,
      email: user.email,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Factory: restrict access to one or more roles.
 * Usage: authorize('admin') or authorize('faculty', 'admin')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access restricted to: ${roles.join(', ')}`,
      });
    }
    next();
  };
};

// Convenient aliases so existing routes keep working
const adminOnly = authorize('admin');
const facultyOnly = authorize('faculty', 'admin');
const studentOnly = authorize('student', 'admin');

module.exports = {
  authMiddleware,
  authorize,
  adminOnly,
  facultyOnly,
  studentOnly,
};
