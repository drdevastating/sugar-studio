const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// GET /api/categories - Get all categories
router.get('/', categoryController.getAllCategories);

// GET /api/categories/stats - Get category statistics (MOVED UP)
router.get('/stats', categoryController.getCategoryStats);

// GET /api/categories/:id - Get single category by ID
router.get('/:id', categoryController.getCategoryById);

// GET /api/categories/:id/products - Get category with products
router.get('/:id/products', categoryController.getCategoryWithProducts);

// POST /api/categories - Create new category
router.post('/', categoryController.createCategory);

// PUT /api/categories/:id - Update category
router.put('/:id', categoryController.updateCategory);

// DELETE /api/categories/:id - Deactivate category (soft delete)
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;