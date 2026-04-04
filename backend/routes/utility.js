const express = require('express');
const router = express.Router();
const {
  createUtility,
  getAllUtilities,
  getUtilityById,
  updateUtility,
  deleteUtility,
} = require('../controllers/utilityController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

/**
 * POST /api/utilities
 * Create a new utility
 * Admin only
 */
router.post('/', authMiddleware, adminOnly, createUtility);

/**
 * GET /api/utilities
 * Get all utilities
 * Admin only
 */
router.get('/', authMiddleware, adminOnly, getAllUtilities);

/**
 * GET /api/utilities/:id
 * Get a specific utility
 * Authenticated users
 */
router.get('/:id', authMiddleware, getUtilityById);

/**
 * PUT /api/utilities/:id
 * Update a utility
 * Admin only
 */
router.put('/:id', authMiddleware, adminOnly, updateUtility);

/**
 * DELETE /api/utilities/:id
 * Delete a utility
 * Admin only
 */
router.delete('/:id', authMiddleware, adminOnly, deleteUtility);

module.exports = router;
