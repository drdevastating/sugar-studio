const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    { expiresIn: '30d' } // Longer expiry for customers
  );
};

const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication token required'
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
    );

    // Check if user is admin/staff or customer
    if (decoded.role === 'customer') {
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

      req.user = { ...customer, role: 'customer' };
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

      req.user = user;
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token expired'
      });
    }
    
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token'
    });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      status: 'error',
      message: 'Admin access required'
    });
  }
  next();
};

const requireStaff = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'staff') {
    return res.status(403).json({
      status: 'error',
      message: 'Staff access required'
    });
  }
  next();
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
      );

      if (decoded.role === 'customer') {
        const customerQuery = 'SELECT id, first_name, last_name, email, phone, is_active FROM customers WHERE id = $1';
        const result = await pool.query(customerQuery, [decoded.id]);

        if (result.rows.length > 0 && result.rows[0].is_active) {
          req.user = { ...result.rows[0], role: 'customer' };
        }
      } else {
        const userQuery = 'SELECT id, email, full_name, role, is_active FROM users WHERE id = $1';
        const result = await pool.query(userQuery, [decoded.id]);

        if (result.rows.length > 0 && result.rows[0].is_active) {
          req.user = result.rows[0];
        }
      }
    }
  } catch (error) {
    // Ignore errors for optional auth
  }
  next();
};

module.exports = {
  generateToken,
  verifyToken,
  requireAdmin,
  requireStaff,
  optionalAuth
};