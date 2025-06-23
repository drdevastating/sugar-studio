const pool = require('../config/database');

const categoryController = {
  // Get all categories
  getAllCategories: async (req, res) => {
    try {
      const { is_active } = req.query;
      
      let query = 'SELECT * FROM categories WHERE 1=1';
      const params = [];
      let paramCount = 0;
      
      if (is_active !== undefined) {
        paramCount++;
        query += ` AND is_active = $${paramCount}`;
        params.push(is_active === 'true');
      }
      
      query += ' ORDER BY name ASC';
      
      const result = await pool.query(query, params);
      
      res.json({
        status: 'success',
        data: result.rows,
        count: result.rows.length
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch categories',
        error: error.message
      });
    }
  },

  // Get single category by ID
  getCategoryById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const result = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Category not found'
        });
      }
      
      res.json({
        status: 'success',
        data: result.rows[0]
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch category',
        error: error.message
      });
    }
  },

  // Get category with products
  getCategoryWithProducts: async (req, res) => {
    try {
      const { id } = req.params;
      const { available_only } = req.query;
      
      // Get category
      const categoryResult = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
      
      if (categoryResult.rows.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Category not found'
        });
      }
      
      // Get products in category
      let productsQuery = 'SELECT * FROM products WHERE category_id = $1';
      const params = [id];
      
      if (available_only === 'true') {
        productsQuery += ' AND is_available = true';
      }
      
      productsQuery += ' ORDER BY name ASC';
      
      const productsResult = await pool.query(productsQuery, params);
      
      const category = categoryResult.rows[0];
      category.products = productsResult.rows;
      
      res.json({
        status: 'success',
        data: category
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch category with products',
        error: error.message
      });
    }
  },

  // Create new category
  createCategory: async (req, res) => {
    try {
      const { name, description, image_url } = req.body;

      // Check if category name already exists
      const existingCategory = await pool.query('SELECT id FROM categories WHERE name = $1', [name]);
      
      if (existingCategory.rows.length > 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Category with this name already exists'
        });
      }

      const query = `
        INSERT INTO categories (name, description, image_url)
        VALUES ($1, $2, $3)
        RETURNING *
      `;

      const values = [name, description, image_url];
      const result = await pool.query(query, values);

      res.status(201).json({
        status: 'success',
        message: 'Category created successfully',
        data: result.rows[0]
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to create category',
        error: error.message
      });
    }
  },

  // Update category
  updateCategory: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Check if category exists
      const existingCategory = await pool.query('SELECT id FROM categories WHERE id = $1', [id]);
      
      if (existingCategory.rows.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Category not found'
        });
      }
      
      // If updating name, check for duplicates
      if (updates.name) {
        const nameCheck = await pool.query('SELECT id FROM categories WHERE name = $1 AND id != $2', [updates.name, id]);
        
        if (nameCheck.rows.length > 0) {
          return res.status(400).json({
            status: 'error',
            message: 'Category name already exists'
          });
        }
      }
      
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
        UPDATE categories 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount + 1}
        RETURNING *
      `;
      
      const result = await pool.query(query, values);
      
      res.json({
        status: 'success',
        message: 'Category updated successfully',
        data: result.rows[0]
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to update category',
        error: error.message
      });
    }
  },

  // Delete category (soft delete)
  deleteCategory: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if category has products
      const productsCount = await pool.query('SELECT COUNT(*) FROM products WHERE category_id = $1', [id]);
      
      if (parseInt(productsCount.rows[0].count) > 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Cannot delete category with existing products. Please reassign or remove products first.'
        });
      }
      
      const result = await pool.query(
        'UPDATE categories SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Category not found'
        });
      }
      
      res.json({
        status: 'success',
        message: 'Category deactivated successfully'
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to deactivate category',
        error: error.message
      });
    }
  },

  // Get category statistics
  getCategoryStats: async (req, res) => {
    try {
      const statsQuery = `
        SELECT 
          c.id,
          c.name,
          COUNT(p.id) as product_count,
          COUNT(CASE WHEN p.is_available = true THEN 1 END) as available_products,
          AVG(p.price) as average_price,
          MIN(p.price) as min_price,
          MAX(p.price) as max_price
        FROM categories c
        LEFT JOIN products p ON c.id = p.category_id
        WHERE c.is_active = true
        GROUP BY c.id, c.name
        ORDER BY c.name ASC
      `;
      
      const result = await pool.query(statsQuery);
      
      res.json({
        status: 'success',
        data: result.rows
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch category statistics',
        error: error.message
      });
    }
  }
};

module.exports = categoryController;