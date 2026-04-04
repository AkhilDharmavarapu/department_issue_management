const express = require('express');
const router = express.Router();
const {
  createLab,
  getAllLabs,
  getLabById,
  updateLab,
  deleteLab,
} = require('../controllers/labController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

/**
 * POST /api/labs
 * Create a new lab
 * Admin only
 */
router.post('/', authMiddleware, adminOnly, createLab);

/**
 * GET /api/labs
 * Get all labs
 * Admin only
 */
router.get('/', authMiddleware, adminOnly, getAllLabs);

/**
 * GET /api/labs/:id
 * Get a specific lab
 * Authenticated users
 */
router.get('/:id', authMiddleware, getLabById);

/**
 * PUT /api/labs/:id
 * Update a lab
 * Admin only
 */
router.put('/:id', authMiddleware, adminOnly, updateLab);

/**
 * DELETE /api/labs/:id
 * Delete a lab
 * Admin only
 */
router.delete('/:id', authMiddleware, adminOnly, deleteLab);

module.exports = router;
