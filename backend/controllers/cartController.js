// backend/controllers/cartController.js
const pool = require('../config/database');

const cartController = {
  // Get cart items for a customer
  getCart: async (req, res) => {
    try {
      const { customerId } = req.params;

      const query = `
        SELECT 
          ci.id,
          ci.quantity,
          ci.special_instructions,
          p.id as product_id,
          p.name as product_name,
          p.description,
          p.price,
          p.image_url,
          p.is_available,
          (p.price * ci.quantity) as subtotal
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.customer_id = $1
        ORDER BY ci.created_at DESC
      `;

      const result = await pool.query(query, [customerId]);

      // Calculate total
      const total = result.rows.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);

      res.json({
        status: 'success',
        data: {
          items: result.rows,
          total: total.toFixed(2),
          itemCount: result.rows.length
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch cart',
        error: error.message
      });
    }
  },

  // Add item to cart
  addToCart: async (req, res) => {
    try {
      const { customerId, productId, quantity, special_instructions } = req.body;

      if (!customerId || !productId || !quantity) {
        return res.status(400).json({
          status: 'error',
          message: 'Customer ID, product ID, and quantity are required'
        });
      }

      // Check if product exists and is available
      const productQuery = 'SELECT * FROM products WHERE id = $1';
      const productResult = await pool.query(productQuery, [productId]);

      if (productResult.rows.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Product not found'
        });
      }

      const product = productResult.rows[0];

      if (!product.is_available) {
        return res.status(400).json({
          status: 'error',
          message: 'Product is not available'
        });
      }

      // Check if item already exists in cart
      const existingItem = await pool.query(
        'SELECT * FROM cart_items WHERE customer_id = $1 AND product_id = $2',
        [customerId, productId]
      );

      let result;

      if (existingItem.rows.length > 0) {
        // Update existing item
        const newQuantity = existingItem.rows[0].quantity + quantity;
        const query = `
          UPDATE cart_items 
          SET quantity = $1, special_instructions = $2
          WHERE customer_id = $3 AND product_id = $4
          RETURNING *
        `;
        result = await pool.query(query, [newQuantity, special_instructions || existingItem.rows[0].special_instructions, customerId, productId]);
      } else {
        // Insert new item
        const query = `
          INSERT INTO cart_items (customer_id, product_id, quantity, special_instructions)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `;
        result = await pool.query(query, [customerId, productId, quantity, special_instructions]);
      }

      res.status(201).json({
        status: 'success',
        message: 'Item added to cart',
        data: result.rows[0]
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to add item to cart',
        error: error.message
      });
    }
  },

  // Update cart item quantity
  updateCartItem: async (req, res) => {
    try {
      const { id } = req.params;
      const { quantity, special_instructions } = req.body;

      if (!quantity || quantity < 1) {
        return res.status(400).json({
          status: 'error',
          message: 'Quantity must be at least 1'
        });
      }

      const query = `
        UPDATE cart_items 
        SET quantity = $1, special_instructions = $2
        WHERE id = $3
        RETURNING *
      `;

      const result = await pool.query(query, [quantity, special_instructions, id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Cart item not found'
        });
      }

      res.json({
        status: 'success',
        message: 'Cart item updated',
        data: result.rows[0]
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to update cart item',
        error: error.message
      });
    }
  },

  // Remove item from cart
  removeFromCart: async (req, res) => {
    try {
      const { id } = req.params;

      const result = await pool.query(
        'DELETE FROM cart_items WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Cart item not found'
        });
      }

      res.json({
        status: 'success',
        message: 'Item removed from cart'
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to remove item from cart',
        error: error.message
      });
    }
  },

  // Clear entire cart
  clearCart: async (req, res) => {
    try {
      const { customerId } = req.params;

      await pool.query('DELETE FROM cart_items WHERE customer_id = $1', [customerId]);

      res.json({
        status: 'success',
        message: 'Cart cleared'
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to clear cart',
        error: error.message
      });
    }
  }
};

module.exports = cartController;