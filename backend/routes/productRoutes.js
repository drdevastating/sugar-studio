// backend/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken, requireStaff } = require('../middleware/auth');

// GET /api/products - Get all products (public)
router.get('/', productController.getAllProducts);

// GET /api/products/:id - Get single product (public)
router.get('/:id', productController.getProductById);

// POST /api/products - Create new product (staff only)
router.post('/', verifyToken, requireStaff, productController.createProduct);

// PUT /api/products/:id - Update product (staff only)
router.put('/:id', verifyToken, requireStaff, productController.updateProduct);

// DELETE /api/products/:id - Delete product (staff only)
router.delete('/:id', verifyToken, requireStaff, productController.deleteProduct);

// PATCH /api/products/:id/stock - Update product stock (staff only)
router.patch('/:id/stock', verifyToken, requireStaff, productController.updateStock);

module.exports = router;