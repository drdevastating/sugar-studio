// backend/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, requireStaff } = require('../middleware/auth');

// Public routes
router.get('/track/:orderNumber', orderController.trackOrder);
router.post('/', orderController.createOrder);
router.get('/customer', orderController.getCustomerOrders);

// Protected routes (staff only)
router.get('/', verifyToken, requireStaff, orderController.getAllOrders);
router.get('/stats', verifyToken, requireStaff, orderController.getOrderStats);
router.get('/:id', verifyToken, requireStaff, orderController.getOrderById);
router.patch('/:id/status', verifyToken, requireStaff, orderController.updateOrderStatus);
router.patch('/:id/cancel', verifyToken, requireStaff, orderController.cancelOrder);

module.exports = router;