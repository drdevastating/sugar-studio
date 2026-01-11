// backend/controllers/recommendationController.js
const pool = require('../config/database');

const recommendationController = {
  // Get personalized recommendations for a customer
  getRecommendations: async (req, res) => {
    try {
      const { customerId } = req.params;
      const { limit = 6 } = req.query;

      const query = 'SELECT * FROM get_customer_recommendations($1, $2)';
      const result = await pool.query(query, [customerId, parseInt(limit)]);

      res.json({
        status: 'success',
        data: result.rows,
        count: result.rows.length
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch recommendations',
        error: error.message
      });
    }
  },

  // Get customer's order history summary
  getOrderHistory: async (req, res) => {
    try {
      const { customerId } = req.params;

      const query = `
        SELECT 
          o.id,
          o.order_number,
          o.total_amount,
          o.status,
          o.created_at,
          o.customizations,
          COUNT(oi.id) as item_count,
          json_agg(
            json_build_object(
              'product_id', p.id,
              'product_name', p.name,
              'quantity', oi.quantity,
              'price', oi.unit_price,
              'image_url', p.image_url
            )
          ) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE o.customer_id = $1
        GROUP BY o.id
        ORDER BY o.created_at DESC
        LIMIT 5
      `;

      const result = await pool.query(query, [customerId]);

      res.json({
        status: 'success',
        data: result.rows,
        count: result.rows.length
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch order history',
        error: error.message
      });
    }
  }
};

module.exports = recommendationController;

