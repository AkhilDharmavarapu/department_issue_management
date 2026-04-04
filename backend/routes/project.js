const express = require('express');
const router = express.Router();
const {
  createProject,
  getProjectsByClassroom,
  getMyProjects,
  getProjectById,
  updateProject,
  addTeamMember,
  deleteProject,
} = require('../controllers/projectController');
const { authMiddleware, facultyOnly } = require('../middleware/auth');

/**
 * POST /api/projects
 * Create a new project
 * Faculty only
 */
router.post('/', authMiddleware, facultyOnly, createProject);

/**
 * GET /api/projects/my
 * Get all projects created by logged-in faculty
 * Faculty only
 */
router.get('/my', authMiddleware, facultyOnly, getMyProjects);

/**
 * GET /api/projects/class/:classroomId
 * Get all projects in a classroom
 * Faculty and Students of that classroom
 */
router.get('/class/:classroomId', authMiddleware, getProjectsByClassroom);

/**
 * GET /api/projects/:id
 * Get a specific project
 * Authenticated users
 */
router.get('/:id', authMiddleware, getProjectById);

/**
 * PUT /api/projects/:id
 * Update a project
 * Faculty creator only
 */
router.put('/:id', authMiddleware, facultyOnly, updateProject);

/**
 * POST /api/projects/:id/team-members
 * Add a team member to project
 * Faculty creator only
 */
router.post('/:id/team-members', authMiddleware, facultyOnly, addTeamMember);

/**
 * DELETE /api/projects/:id
 * Delete a project
 * Faculty creator only
 */
router.delete('/:id', authMiddleware, facultyOnly, deleteProject);

module.exports = router;
