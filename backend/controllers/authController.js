// backend/controllers/authController.js
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { generateToken } = require('../middleware/auth');

const authController = {
  // Register new user (admin/staff)
  register: async (req, res) => {
    try {
      const { email, password, full_name, role } = req.body;

      // Validate input
      if (!email || !password || !full_name) {
        return res.status(400).json({
          status: 'error',
          message: 'Email, password, and full name are required'
        });
      }

      // Check if user already exists
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

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const query = `
        INSERT INTO users (email, password, full_name, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id, email, full_name, role, created_at
      `;

      const values = [
        email,
        hashedPassword,
        full_name,
        role || 'staff'
      ];

      const result = await pool.query(query, values);
      const user = result.rows[0];

      // Generate token
      const token = generateToken(user.id, user.role);

      res.status(201).json({
        status: 'success',
        message: 'User registered successfully',
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
        message: 'Failed to register user',
        error: error.message
      });
    }
  },

  // Login
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          status: 'error',
          message: 'Email and password are required'
        });
      }

      // Find user
      const query = 'SELECT * FROM users WHERE email = $1';
      const result = await pool.query(query, [email]);

      if (result.rows.length === 0) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid email or password'
        });
      }

      const user = result.rows[0];

      // Check if user is active
      if (!user.is_active) {
        return res.status(401).json({
          status: 'error',
          message: 'Account is deactivated'
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid email or password'
        });
      }

      // Generate token
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

  // Get current user profile
  getProfile: async (req, res) => {
    try {
      res.json({
        status: 'success',
        data: {
          user: req.user
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch profile',
        error: error.message
      });
    }
  },

  // Update password
  updatePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          status: 'error',
          message: 'Current password and new password are required'
        });
      }

      // Get user with password
      const userQuery = 'SELECT password FROM users WHERE id = $1';
      const result = await pool.query(userQuery, [req.user.id]);
      const user = result.rows[0];

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          status: 'error',
          message: 'Current password is incorrect'
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
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

  // Update profile
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
        // Check if email already exists
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
        data: {
          user: result.rows[0]
        }
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