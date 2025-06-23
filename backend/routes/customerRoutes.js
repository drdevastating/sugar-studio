const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

// GET /api/customers - Get all customers (with optional filters)
router.get('/', customerController.getAllCustomers);

// GET /api/customers/:id - Get single customer by ID
router.get('/:id', customerController.getCustomerById);

// GET /api/customers/:id/orders - Get customer order history
router.get('/:id/orders', customerController.getCustomerOrders);

// GET /api/customers/:id/stats - Get customer statistics
router.get('/:id/stats', customerController.getCustomerStats);

// GET /api/customers/email/:email - Get customer by email
router.get('/email/:email', customerController.getCustomerByEmail);

// POST /api/customers - Create new customer
router.post('/', customerController.createCustomer);

// PUT /api/customers/:id - Update customer
router.put('/:id', customerController.updateCustomer);

// DELETE /api/customers/:id - Deactivate customer (soft delete)
router.delete('/:id', customerController.deleteCustomer);

module.exports = router;