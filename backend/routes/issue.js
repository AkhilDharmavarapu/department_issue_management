const express = require('express');
const router = express.Router();
const {
  createIssue,
  getMyIssues,
  getAllIssues,
  getIssueById,
  updateIssueStatus,
  addComment,
} = require('../controllers/issueController');
const { authMiddleware, adminOnly, facultyOnly, studentOnly } = require('../middleware/auth');

/**
 * POST /api/issues
 * Create a new issue
 * Students can create issues
 */
router.post('/', authMiddleware, studentOnly, createIssue);

/**
 * GET /api/issues
 * Get all issues
 * Admin only
 */
router.get('/', authMiddleware, adminOnly, getAllIssues);

/**
 * GET /api/issues/my
 * Get issues for logged-in user's classroom
 * Students, Faculty, Admin
 */
router.get('/my', authMiddleware, getMyIssues);

/**
 * GET /api/issues/:id
 * Get a specific issue by ID
 * Authenticated users
 */
router.get('/:id', authMiddleware, getIssueById);

/**
 * PUT /api/issues/:id/status
 * Update issue status
 * Admin only
 */
router.put('/:id/status', authMiddleware, facultyOnly, updateIssueStatus);

/**
 * POST /api/issues/:id/comments
 * Add a comment to an issue
 * Authenticated users
 */
router.post('/:id/comments', authMiddleware, addComment);

module.exports = router;
