// backend/routes/recommendationRoutes.js
const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');

// GET /api/recommendations/:customerId - Get personalized recommendations
router.get('/:customerId', recommendationController.getRecommendations);

// GET /api/recommendations/:customerId/history - Get order history
router.get('/:customerId/history', recommendationController.getOrderHistory);

module.exports = router;

