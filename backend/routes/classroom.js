const express = require('express');
const router = express.Router();
const {
  createClassroom,
  getAllClassrooms,
  getClassroomById,
  updateClassroom,
  deleteClassroom,
} = require('../controllers/classroomController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

/**
 * POST /api/classrooms
 * Create a new classroom
 * Admin only
 */
router.post('/', authMiddleware, adminOnly, createClassroom);

/**
 * GET /api/classrooms
 * Get all classrooms
 * All authenticated users (faculty needs this for project creation)
 */
router.get('/', authMiddleware, getAllClassrooms);

/**
 * GET /api/classrooms/:id
 * Get a specific classroom
 * Authenticated users
 */
router.get('/:id', authMiddleware, getClassroomById);

/**
 * PUT /api/classrooms/:id
 * Update a classroom
 * Admin only
 */
router.put('/:id', authMiddleware, adminOnly, updateClassroom);

/**
 * DELETE /api/classrooms/:id
 * Delete a classroom
 * Admin only
 */
router.delete('/:id', authMiddleware, adminOnly, deleteClassroom);

module.exports = router;
