const jwt = require('jsonwebtoken');

/**
 * Generates a JWT token for authenticated users
 * @param {string} userId - User's MongoDB ObjectId
 * @param {string} role - User's role (admin, faculty, student)
 * @returns {string} - JWT token
 */
const generateToken = (userId, role) => {
  try {
    const payload = {
      userId,
      role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    });

    return token;
  } catch (error) {
    throw new Error('Error generating token: ' + error.message);
  }
};

/**
 * Verifies and decodes a JWT token
 * @param {string} token - JWT token to verify
 * @returns {object} - Decoded token payload
 */
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token: ' + error.message);
  }
};

module.exports = {
  generateToken,
  verifyToken,
};
