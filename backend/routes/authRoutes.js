const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// Staff/Admin Routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile', verifyToken, authController.getProfile);
router.put('/profile', verifyToken, authController.updateProfile);
router.put('/password', verifyToken, authController.updatePassword);

// Customer Auth Routes
router.post('/google', authController.googleAuth);
router.post('/phone', authController.phoneAuth);
router.post('/send-otp', authController.sendOTP);

// Customer Profile (requires customer token)
router.get('/customer/profile', verifyToken, authController.getCustomerProfile);

module.exports = router;