// backend/routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

// GET /api/cart/:customerId - Get cart items
router.get('/:customerId', cartController.getCart);

// POST /api/cart - Add item to cart
router.post('/', cartController.addToCart);

// PUT /api/cart/:id - Update cart item
router.put('/:id', cartController.updateCartItem);

// DELETE /api/cart/:id - Remove item from cart
router.delete('/:id', cartController.removeFromCart);

// DELETE /api/cart/clear/:customerId - Clear entire cart
router.delete('/clear/:customerId', cartController.clearCart);

module.exports = router;