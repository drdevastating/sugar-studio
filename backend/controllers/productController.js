const pool = require('../config/database');

const productController = {
  // Get all products
  getAllProducts: async (req, res) => {
    try {
      const { category, available, limit, offset } = req.query;

      let query = `
        SELECT p.*, c.name as category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 0;

      if (category) {
        paramCount++;
        query += ` AND c.name = $${paramCount}`;
        params.push(category);
      }

      if (available !== undefined) {
        paramCount++;
        query += ` AND p.is_available = $${paramCount}`;
        params.push(available === 'true');
      }

      // Order by newest first
      query += ' ORDER BY p.created_at DESC';

      if (limit) {
        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(parseInt(limit));
      }

      if (offset) {
        paramCount++;
        query += ` OFFSET $${paramCount}`;
        params.push(parseInt(offset));
      }

      const result = await pool.query(query, params);

      res.json({
        status: 'success',
        data: result.rows,
        count: result.rows.length
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch products',
        error: error.message
      });
    }
  },

  // Get single product
  getProductById: async (req, res) => {
    try {
      const { id } = req.params;

      const query = `
        SELECT p.*, c.name as category_name 
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = $1
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Product not found'
        });
      }

      res.json({
        status: 'success',
        data: result.rows[0]
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch product',
        error: error.message
      });
    }
  },

  // Create product
  createProduct: async (req, res) => {
    try {
      const {
        name, description, price, category_id, image_url,
        ingredients, is_available, stock_quantity,
        preparation_time
      } = req.body;

      const query = `
        INSERT INTO products
        (name, description, price, category_id, image_url, ingredients, 
         is_available, stock_quantity, preparation_time, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING *
      `;

      const values = [
        name, description, price, category_id, image_url,
        ingredients, is_available || false, stock_quantity,
        preparation_time
      ];

      const result = await pool.query(query, values);

      res.status(201).json({
        status: 'success',
        message: 'Product created successfully',
        data: result.rows[0]
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to create product',
        error: error.message
      });
    }
  },

  // Update product
  updateProduct: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Only allow columns that exist in DB
      const allowedFields = [
        'name', 'description', 'price', 'category_id',
        'image_url', 'ingredients', 'is_available',
        'stock_quantity', 'preparation_time'
      ];

      const updateFields = [];
      const values = [];
      let paramCount = 0;

      Object.keys(updates).forEach(key => {
        if (allowedFields.includes(key) && updates[key] !== undefined) {
          paramCount++;
          updateFields.push(`${key} = $${paramCount}`);
          values.push(updates[key]);
        }
      });

      if (updateFields.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'No valid fields to update'
        });
      }

      // Always update the timestamp
      updateFields.push(`updated_at = NOW()`);

      values.push(id);
      const query = `
        UPDATE products
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount + 1}
        RETURNING *
      `;

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Product not found'
        });
      }

      res.json({
        status: 'success',
        message: 'Product updated successfully',
        data: result.rows[0]
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to update product',
        error: error.message
      });
    }
  },

  // Delete product
  deleteProduct: async (req, res) => {
    try {
      const { id } = req.params;

      const result = await pool.query(
        'DELETE FROM products WHERE id = $1 RETURNING *', 
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Product not found'
        });
      }

      res.json({
        status: 'success',
        message: 'Product deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete product',
        error: error.message
      });
    }
  },

  // Update stock quantity
  updateStock: async (req, res) => {
    try {
      const { id } = req.params;
      const { quantity, operation } = req.body;

      let query;
      if (operation === 'add') {
        query = `
          UPDATE products
          SET stock_quantity = stock_quantity + $1, updated_at = NOW()
          WHERE id = $2
          RETURNING *
        `;
      } else if (operation === 'subtract') {
        query = `
          UPDATE products
          SET stock_quantity = GREATEST(stock_quantity - $1, 0), updated_at = NOW()
          WHERE id = $2
          RETURNING *
        `;
      } else {
        query = `
          UPDATE products
          SET stock_quantity = $1, updated_at = NOW()
          WHERE id = $2
          RETURNING *
        `;
      }

      const result = await pool.query(query, [quantity, id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Product not found'
        });
      }

      res.json({
        status: 'success',
        message: 'Stock updated successfully',
        data: result.rows[0]
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to update stock',
        error: error.message
      });
    }
  }
};

module.exports = productController;
