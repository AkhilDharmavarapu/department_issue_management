const express = require('express');
const router = express.Router();
const { getAdminStats, getFacultyStats, getStudentStats } = require('../controllers/statsController');
const { authMiddleware, adminOnly, facultyOnly, studentOnly } = require('../middleware/auth');

router.get('/admin', authMiddleware, adminOnly, getAdminStats);
router.get('/faculty', authMiddleware, facultyOnly, getFacultyStats);
router.get('/student', authMiddleware, studentOnly, getStudentStats);

module.exports = router;
