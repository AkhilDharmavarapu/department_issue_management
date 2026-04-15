const express = require('express');
const router = express.Router();
const { login, register, getAllUsers, updateUser, getMe, assignHOD, deleteUser } = require('../controllers/authController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// Public
router.post('/login', login);

// Authenticated
router.get('/me', authMiddleware, getMe);

// Admin only
router.post('/register', authMiddleware, adminOnly, register);
router.get('/users', authMiddleware, adminOnly, getAllUsers);
router.put('/users/:id', authMiddleware, adminOnly, updateUser);
router.delete('/users/:id', authMiddleware, adminOnly, deleteUser);
router.post('/assign-hod', authMiddleware, adminOnly, assignHOD);

module.exports = router;
