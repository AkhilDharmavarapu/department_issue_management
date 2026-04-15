const express = require('express');
const router = express.Router();
const {
  createIssue,
  getMyIssues,
  getAllIssues,
  getIssueById,
  updateIssueStatus,
  uploadResolutionProof,
  addComment,
} = require('../controllers/issueController');
const { authMiddleware, authorize } = require('../middleware/auth');
const uploadIssueProof = require('../middleware/issueUpload');

/**
 * POST /api/issues
 * Create a new issue with optional proof file
 * Students can create issues
 */
router.post('/', authMiddleware, authorize('student', 'admin'), uploadIssueProof, createIssue);

/**
 * GET /api/issues
 * Get all issues
 * Admin and HOD only
 */
router.get('/', authMiddleware, authorize('admin', 'hod'), getAllIssues);

/**
 * GET /api/issues/my
 * Get issues for logged-in user's classroom
 * Students, Faculty, Admin, HOD
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
 * Faculty, Admin, HOD
 */
router.put('/:id/status', authMiddleware, authorize('faculty', 'admin', 'hod'), updateIssueStatus);

/**
 * POST /api/issues/:id/resolution-proof
 * Upload resolution proof when resolving issue
 * Faculty, Admin, HOD
 */
router.post('/:id/resolution-proof', authMiddleware, authorize('faculty', 'admin', 'hod'), uploadIssueProof, uploadResolutionProof);

/**
 * POST /api/issues/:id/comments
 * Add a comment to an issue
 * Authenticated users
 */
router.post('/:id/comments', authMiddleware, addComment);

module.exports = router;
