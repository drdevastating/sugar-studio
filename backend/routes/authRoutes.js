// backend/routes/authRoutes.js - Clean routes (Email + Google only)
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// Admin Login
router.post('/admin/login', authController.adminLogin);

// Customer Routes - Email/Password
router.post('/customer/register', authController.customerEmailRegister);
router.post('/customer/login', authController.customerEmailLogin);

// Customer Routes - Google OAuth
router.post('/customer/google', authController.googleAuth);

// Common Routes
router.post('/refresh', authController.refreshToken);
router.post('/logout', verifyToken, authController.logout);
router.get('/profile', verifyToken, authController.getProfile);

module.exports = router;