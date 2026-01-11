// backend/controllers/authController.js - Enhanced Version
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { generateToken } = require('../middleware/auth');

const authController = {
  // Register new user (admin/staff)
  register: async (req, res) => {
    try {
      const { email, password, full_name, role } = req.body;

      if (!email || !password || !full_name) {
        return res.status(400).json({
          status: 'error',
          message: 'Email, password, and full name are required'
        });
      }

      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({
          status: 'error',
          message: 'User with this email already exists'
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const query = `
        INSERT INTO users (email, password, full_name, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id, email, full_name, role, created_at
      `;

      const values = [email, hashedPassword, full_name, role || 'staff'];
      const result = await pool.query(query, values);
      const user = result.rows[0];

      const token = generateToken(user.id, user.role);

      res.status(201).json({
        status: 'success',
        message: 'User registered successfully',
        data: { user, token }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to register user',
        error: error.message
      });
    }
  },

  // Customer Login/Register with Google
  googleAuth: async (req, res) => {
    try {
      const { email, name, googleId, picture } = req.body;

      if (!email || !googleId) {
        return res.status(400).json({
          status: 'error',
          message: 'Email and Google ID are required'
        });
      }

      // Check if customer exists
      let customer = await pool.query(
        'SELECT * FROM customers WHERE email = $1',
        [email]
      );

      if (customer.rows.length === 0) {
        // Create new customer
        const nameParts = name.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ');

        const insertQuery = `
          INSERT INTO customers (first_name, last_name, email, preferences)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `;

        const preferences = {
          auth_provider: 'google',
          google_id: googleId,
          profile_picture: picture
        };

        customer = await pool.query(insertQuery, [
          firstName,
          lastName || '',
          email,
          JSON.stringify(preferences)
        ]);
      } else {
        // Update google info if not present
        const existingPrefs = customer.rows[0].preferences || {};
        if (!existingPrefs.google_id) {
          await pool.query(
            'UPDATE customers SET preferences = $1 WHERE id = $2',
            [JSON.stringify({ ...existingPrefs, google_id: googleId, profile_picture: picture }), customer.rows[0].id]
          );
        }
      }

      const customerData = customer.rows[0];
      const token = generateToken(customerData.id, 'customer');

      res.json({
        status: 'success',
        message: 'Google authentication successful',
        data: {
          customer: {
            id: customerData.id,
            first_name: customerData.first_name,
            last_name: customerData.last_name,
            email: customerData.email,
            preferences: customerData.preferences
          },
          token
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to authenticate with Google',
        error: error.message
      });
    }
  },

  // Customer Login/Register with Phone (OTP-based)
  phoneAuth: async (req, res) => {
    try {
      const { phone, otp, firstName, lastName } = req.body;

      if (!phone) {
        return res.status(400).json({
          status: 'error',
          message: 'Phone number is required'
        });
      }

      // In production, verify OTP here
      // For now, we'll accept any 6-digit OTP for demo
      if (otp && otp.length !== 6) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid OTP'
        });
      }

      // Check if customer exists
      let customer = await pool.query(
        'SELECT * FROM customers WHERE phone = $1',
        [phone]
      );

      if (customer.rows.length === 0) {
        // Create new customer (requires name on first login)
        if (!firstName) {
          return res.status(400).json({
            status: 'error',
            message: 'First name required for new accounts'
          });
        }

        const insertQuery = `
          INSERT INTO customers (first_name, last_name, phone, email, preferences)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `;

        const preferences = { auth_provider: 'phone' };
        // Generate placeholder email
        const placeholderEmail = `${phone}@phone.user`;

        customer = await pool.query(insertQuery, [
          firstName,
          lastName || '',
          phone,
          placeholderEmail,
          JSON.stringify(preferences)
        ]);
      }

      const customerData = customer.rows[0];
      const token = generateToken(customerData.id, 'customer');

      res.json({
        status: 'success',
        message: 'Phone authentication successful',
        data: {
          customer: {
            id: customerData.id,
            first_name: customerData.first_name,
            last_name: customerData.last_name,
            phone: customerData.phone,
            email: customerData.email,
            preferences: customerData.preferences
          },
          token
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to authenticate with phone',
        error: error.message
      });
    }
  },

  // Send OTP (simplified for demo)
  sendOTP: async (req, res) => {
    try {
      const { phone } = req.body;

      if (!phone) {
        return res.status(400).json({
          status: 'error',
          message: 'Phone number is required'
        });
      }

      // In production, integrate with SMS service like Twilio
      // For demo, just generate a random OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      console.log(`📱 OTP for ${phone}: ${otp}`);

      // Store OTP in session/redis in production
      // For demo, we'll just return success
      res.json({
        status: 'success',
        message: 'OTP sent successfully',
        // Remove this in production!
        debug_otp: otp
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to send OTP',
        error: error.message
      });
    }
  },

  // Get customer profile (for logged in customers)
  getCustomerProfile: async (req, res) => {
    try {
      const customerId = req.user.id;

      const customerQuery = `
        SELECT c.*, 
               COUNT(DISTINCT o.id) as total_orders,
               SUM(o.total_amount) as total_spent
        FROM customers c
        LEFT JOIN orders o ON c.id = o.customer_id AND o.status = 'delivered'
        WHERE c.id = $1
        GROUP BY c.id
      `;

      const result = await pool.query(customerQuery, [customerId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Customer not found'
        });
      }

      // Get last 5 orders
      const ordersQuery = `
        SELECT o.*, COUNT(oi.id) as item_count
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.customer_id = $1
        GROUP BY o.id
        ORDER BY o.created_at DESC
        LIMIT 5
      `;

      const ordersResult = await pool.query(ordersQuery, [customerId]);

      res.json({
        status: 'success',
        data: {
          customer: result.rows[0],
          recent_orders: ordersResult.rows
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch customer profile',
        error: error.message
      });
    }
  },

  // Login (existing admin/staff login)
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          status: 'error',
          message: 'Email and password are required'
        });
      }

      const query = 'SELECT * FROM users WHERE email = $1';
      const result = await pool.query(query, [email]);

      if (result.rows.length === 0) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid email or password'
        });
      }

      const user = result.rows[0];

      if (!user.is_active) {
        return res.status(401).json({
          status: 'error',
          message: 'Account is deactivated'
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid email or password'
        });
      }

      const token = generateToken(user.id, user.role);

      res.json({
        status: 'success',
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role
          },
          token
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to login',
        error: error.message
      });
    }
  },

  getProfile: async (req, res) => {
    try {
      res.json({
        status: 'success',
        data: { user: req.user }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch profile',
        error: error.message
      });
    }
  },

  updatePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          status: 'error',
          message: 'Current password and new password are required'
        });
      }

      const userQuery = 'SELECT password FROM users WHERE id = $1';
      const result = await pool.query(userQuery, [req.user.id]);
      const user = result.rows[0];

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          status: 'error',
          message: 'Current password is incorrect'
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await pool.query(
        'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [hashedPassword, req.user.id]
      );

      res.json({
        status: 'success',
        message: 'Password updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to update password',
        error: error.message
      });
    }
  },

  updateProfile: async (req, res) => {
    try {
      const { full_name, email } = req.body;

      const updates = [];
      const values = [];
      let paramCount = 0;

      if (full_name) {
        paramCount++;
        updates.push(`full_name = $${paramCount}`);
        values.push(full_name);
      }

      if (email) {
        const existingUser = await pool.query(
          'SELECT id FROM users WHERE email = $1 AND id != $2',
          [email, req.user.id]
        );

        if (existingUser.rows.length > 0) {
          return res.status(400).json({
            status: 'error',
            message: 'Email already in use'
          });
        }

        paramCount++;
        updates.push(`email = $${paramCount}`);
        values.push(email);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'No fields to update'
        });
      }

      values.push(req.user.id);
      const query = `
        UPDATE users 
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount + 1}
        RETURNING id, email, full_name, role
      `;

      const result = await pool.query(query, values);

      res.json({
        status: 'success',
        message: 'Profile updated successfully',
        data: { user: result.rows[0] }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to update profile',
        error: error.message
      });
    }
  }
};

module.exports = authController;