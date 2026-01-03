// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// POST /api/auth/register - Register new user
router.post('/register', authController.register);

// POST /api/auth/login - Login
router.post('/login', authController.login);

// GET /api/auth/profile - Get current user profile (protected)
router.get('/profile', verifyToken, authController.getProfile);

// PUT /api/auth/profile - Update profile (protected)
router.put('/profile', verifyToken, authController.updateProfile);

// PUT /api/auth/password - Update password (protected)
router.put('/password', verifyToken, authController.updatePassword);

module.exports = router;