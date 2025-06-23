const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// GET /api/products - Get all products (with optional filters)
router.get('/', productController.getAllProducts);

// GET /api/products/:id - Get single product by ID
router.get('/:id', productController.getProductById);

// POST /api/products - Create new product
router.post('/', productController.createProduct);

// PUT /api/products/:id - Update product
router.put('/:id', productController.updateProduct);

// DELETE /api/products/:id - Delete product
router.delete('/:id', productController.deleteProduct);

// PATCH /api/products/:id/stock - Update product stock
router.patch('/:id/stock', productController.updateStock);

module.exports = router;