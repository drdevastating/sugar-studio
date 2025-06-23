const pool = require('../config/database');

const customerController = {
  // Get all customers
  getAllCustomers: async (req, res) => {
    try {
      const { limit, offset, search, is_active } = req.query;
      
      let query = 'SELECT * FROM customers WHERE 1=1';
      const params = [];
      let paramCount = 0;
      
      if (search) {
        paramCount++;
        query += ` AND (first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
        params.push(`%${search}%`);
      }
      
      if (is_active !== undefined) {
        paramCount++;
        query += ` AND is_active = $${paramCount}`;
        params.push(is_active === 'true');
      }
      
      query += ' ORDER BY created_at DESC';
      
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
        message: 'Failed to fetch customers',
        error: error.message
      });
    }
  },

  // Get single customer by ID
  getCustomerById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const result = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Customer not found'
        });
      }
      
      res.json({
        status: 'success',
        data: result.rows[0]
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch customer',
        error: error.message
      });
    }
  },

  // Create new customer
  createCustomer: async (req, res) => {
    try {
      const {
        first_name, last_name, email, phone, address,
        date_of_birth, preferences
      } = req.body;

      // Check if email already exists
      const existingCustomer = await pool.query('SELECT id FROM customers WHERE email = $1', [email]);
      
      if (existingCustomer.rows.length > 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Customer with this email already exists'
        });
      }

      const query = `
        INSERT INTO customers 
        (first_name, last_name, email, phone, address, date_of_birth, preferences)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const values = [
        first_name, last_name, email, phone, address,
        date_of_birth, preferences
      ];

      const result = await pool.query(query, values);

      res.status(201).json({
        status: 'success',
        message: 'Customer created successfully',
        data: result.rows[0]
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to create customer',
        error: error.message
      });
    }
  },

  // Update customer
  updateCustomer: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Check if customer exists
      const existingCustomer = await pool.query('SELECT id FROM customers WHERE id = $1', [id]);
      
      if (existingCustomer.rows.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Customer not found'
        });
      }
      
      // If updating email, check for duplicates
      if (updates.email) {
        const emailCheck = await pool.query('SELECT id FROM customers WHERE email = $1 AND id != $2', [updates.email, id]);
        
        if (emailCheck.rows.length > 0) {
          return res.status(400).json({
            status: 'error',
            message: 'Email already exists for another customer'
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
        UPDATE customers 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount + 1}
        RETURNING *
      `;
      
      const result = await pool.query(query, values);
      
      res.json({
        status: 'success',
        message: 'Customer updated successfully',
        data: result.rows[0]
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to update customer',
        error: error.message
      });
    }
  },

  // Delete customer (soft delete)
  deleteCustomer: async (req, res) => {
    try {
      const { id } = req.params;
      
      const result = await pool.query(
        'UPDATE customers SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Customer not found'
        });
      }
      
      res.json({
        status: 'success',
        message: 'Customer deactivated successfully'
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to deactivate customer',
        error: error.message
      });
    }
  },

  // Get customer order history
  getCustomerOrders: async (req, res) => {
    try {
      const { id } = req.params;
      const { limit, offset } = req.query;
      
      let query = `
        SELECT o.*, COUNT(oi.id) as item_count
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.customer_id = $1
        GROUP BY o.id
        ORDER BY o.created_at DESC
      `;
      
      const params = [id];
      let paramCount = 1;
      
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
        message: 'Failed to fetch customer orders',
        error: error.message
      });
    }
  },

  // Get customer by email
  getCustomerByEmail: async (req, res) => {
    try {
      const { email } = req.params;
      
      const result = await pool.query('SELECT * FROM customers WHERE email = $1', [email]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Customer not found'
        });
      }
      
      res.json({
        status: 'success',
        data: result.rows[0]
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch customer',
        error: error.message
      });
    }
  },

  // Get customer statistics
  getCustomerStats: async (req, res) => {
    try {
      const { id } = req.params;
      
      const statsQuery = `
        SELECT 
          COUNT(o.id) as total_orders,
          SUM(o.total_amount) as total_spent,
          AVG(o.total_amount) as average_order_value,
          MAX(o.created_at) as last_order_date,
          COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) as completed_orders
        FROM orders o
        WHERE o.customer_id = $1
      `;
      
      const result = await pool.query(statsQuery, [id]);
      
      res.json({
        status: 'success',
        data: result.rows[0]
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch customer statistics',
        error: error.message
      });
    }
  }
};

module.exports = customerController;