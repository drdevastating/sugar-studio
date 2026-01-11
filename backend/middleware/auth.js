// backend/middleware/auth.js - Enhanced JWT verification
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication token required'
      });
    }

    // Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if session exists and is valid
    const session = await pool.query(
      'SELECT * FROM user_sessions WHERE token = $1 AND expires_at > NOW()',
      [token]
    );

    if (session.rows.length === 0) {
      return res.status(401).json({
        status: 'error',
        message: 'Session expired or invalid'
      });
    }

    // Get user or customer data
    if (decoded.isCustomer) {
      const customerQuery = 'SELECT id, first_name, last_name, email, phone, is_active FROM customers WHERE id = $1';
      const result = await pool.query(customerQuery, [decoded.id]);

      if (result.rows.length === 0) {
        return res.status(401).json({
          status: 'error',
          message: 'Customer no longer exists'
        });
      }

      const customer = result.rows[0];

      if (!customer.is_active) {
        return res.status(401).json({
          status: 'error',
          message: 'Customer account is deactivated'
        });
      }

      req.user = { ...customer, role: 'customer', isCustomer: true };
    } else {
      const userQuery = 'SELECT id, email, full_name, role, is_active FROM users WHERE id = $1';
      const result = await pool.query(userQuery, [decoded.id]);

      if (result.rows.length === 0) {
        return res.status(401).json({
          status: 'error',
          message: 'User no longer exists'
        });
      }

      const user = result.rows[0];

      if (!user.is_active) {
        return res.status(401).json({
          status: 'error',
          message: 'User account is deactivated'
        });
      }

      req.user = { ...user, isCustomer: false };
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token'
    });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.isCustomer || req.user.role !== 'admin') {
    return res.status(403).json({
      status: 'error',
      message: 'Admin access required'
    });
  }
  next();
};

const requireStaff = (req, res, next) => {
  if (req.user.isCustomer) {
    return res.status(403).json({
      status: 'error',
      message: 'Staff access required'
    });
  }
  if (req.user.role !== 'admin' && req.user.role !== 'staff') {
    return res.status(403).json({
      status: 'error',
      message: 'Staff access required'
    });
  }
  next();
};

const requireCustomer = (req, res, next) => {
  if (!req.user.isCustomer) {
    return res.status(403).json({
      status: 'error',
      message: 'Customer access required'
    });
  }
  next();
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);

      if (decoded.isCustomer) {
        const customerQuery = 'SELECT id, first_name, last_name, email, phone, is_active FROM customers WHERE id = $1';
        const result = await pool.query(customerQuery, [decoded.id]);

        if (result.rows.length > 0 && result.rows[0].is_active) {
          req.user = { ...result.rows[0], role: 'customer', isCustomer: true };
        }
      } else {
        const userQuery = 'SELECT id, email, full_name, role, is_active FROM users WHERE id = $1';
        const result = await pool.query(userQuery, [decoded.id]);

        if (result.rows.length > 0 && result.rows[0].is_active) {
          req.user = { ...result.rows[0], isCustomer: false };
        }
      }
    }
  } catch (error) {
    // Ignore errors for optional auth
  }
  next();
};

module.exports = {
  verifyToken,
  requireAdmin,
  requireStaff,
  requireCustomer,
  optionalAuth
};