const express = require('express');
const router = express.Router();
const { login, register, getAllUsers, updateUser, getMe } = require('../controllers/authController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// Public
router.post('/login', login);

// Authenticated
router.get('/me', authMiddleware, getMe);

// Admin only
router.post('/register', authMiddleware, adminOnly, register);
router.get('/users', authMiddleware, adminOnly, getAllUsers);
router.put('/users/:id', authMiddleware, adminOnly, updateUser);

module.exports = router;
