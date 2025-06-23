const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// GET /api/orders - Get all orders (with optional filters)
router.get('/', orderController.getAllOrders);

// GET /api/orders/stats - Get order statistics
router.get('/stats', orderController.getOrderStats);

// GET /api/orders/:id - Get single order by ID with items
router.get('/:id', orderController.getOrderById);

// POST /api/orders - Create new order
router.post('/', orderController.createOrder);

// PATCH /api/orders/:id/status - Update order status
router.patch('/:id/status', orderController.updateOrderStatus);

// PATCH /api/orders/:id/cancel - Cancel order
router.patch('/:id/cancel', orderController.cancelOrder);

module.exports = router;