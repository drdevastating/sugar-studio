const pool = require('../config/database');

const productController = {
  // Get all products
  getAllProducts: async (req, res) => {
    try {
      const { category, available, featured, limit, offset } = req.query;
      
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
        query += ` AND c.name = $${paramCount}`; // all this stuff to avoid sql injection beta
        params.push(category);
      }
      
      if (available !== undefined) {
        paramCount++;
        query += ` AND p.is_available = $${paramCount}`;
        params.push(available === 'true');
      }
      
      if (featured !== undefined) {
        paramCount++;
        query += ` AND p.is_featured = $${paramCount}`;
        params.push(featured === 'true');
      }
      
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
      
      const result = await pool.query(query, params); // $1 will be replaced by the element at 1st index
      
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

  // Get single product by ID
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

  // Create new product
  createProduct: async (req, res) => {
    try {
      const {
        name, description, price, category_id, image_url,
        ingredients, allergens, nutritional_info, stock_quantity,
        preparation_time, is_featured
      } = req.body;

      const query = `
        INSERT INTO products 
        (name, description, price, category_id, image_url, ingredients, 
         allergens, nutritional_info, stock_quantity, preparation_time, is_featured)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING * 
      `;
// * returning se jis row par affect pada hai vo purp return karega
      const values = [
        name, description, price, category_id, image_url,
        ingredients, allergens, nutritional_info, stock_quantity,
        preparation_time, is_featured || false
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
      
      // Build dynamic update query
      const updateFields = [];
      const values = [];
      let paramCount = 0;
      
      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) {
          paramCount++;
          updateFields.push(`${key} = $${paramCount}`);
          values.push(updates[key]);
        }
      });
      
      if (updateFields.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'No fields to update'
        });
      }
      
      values.push(id);
      const query = `
        UPDATE products 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
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
      
      const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
      
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
      const { quantity, operation } = req.body; // operation: 'add' or 'subtract'
      
      let query;
      if (operation === 'add') {
        query = 'UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2 RETURNING *';
      } else if (operation === 'subtract') {
        query = 'UPDATE products SET stock_quantity = GREATEST(stock_quantity - $1, 0) WHERE id = $2 RETURNING *';
      } else {
        query = 'UPDATE products SET stock_quantity = $1 WHERE id = $2 RETURNING *';
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