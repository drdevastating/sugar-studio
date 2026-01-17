// backend/controllers/authController.js - SECURED VERSION
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// ALWAYS use environment variables - never hardcode secrets
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Validate that secrets are set
if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  console.error('FATAL ERROR: JWT secrets not set in environment variables');
  process.exit(1);
}

// Input validation helper
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  // Minimum 8 characters, at least one letter and one number
  return password && password.length >= 8;
};

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  // Remove any potential SQL injection characters
  return input.trim();
};

const generateTokens = (userId, role, isCustomer = false) => {
  const accessToken = jwt.sign(
    { id: userId, role, isCustomer },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    { id: userId, role, isCustomer },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );

  return { accessToken, refreshToken };
};

const storeSession = async (userId, customerId, tokens, userAgent, ipAddress) => {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // ✅ SECURE: Using parameterized query
  await pool.query(
    `INSERT INTO user_sessions (user_id, customer_id, token, refresh_token, user_agent, ip_address, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [userId, customerId, tokens.accessToken, tokens.refreshToken, userAgent, ipAddress, expiresAt]
  );
};

const authController = {
  // Admin/Staff Login
  adminLogin: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Input validation
      if (!email || !password) {
        return res.status(400).json({
          status: 'error',
          message: 'Email and password are required'
        });
      }

      // Validate email format
      if (!validateEmail(email)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid email format'
        });
      }

      // Sanitize inputs
      const sanitizedEmail = sanitizeInput(email);

      // ✅ SECURE: Parameterized query prevents SQL injection
      const query = 'SELECT * FROM users WHERE email = $1';
      const result = await pool.query(query, [sanitizedEmail]);

      if (result.rows.length === 0) {
        // Generic error message to prevent user enumeration
        return res.status(401).json({
          status: 'error',
          message: 'Invalid credentials'
        });
      }

      const user = result.rows[0];

      if (!user.is_active) {
        return res.status(401).json({
          status: 'error',
          message: 'Account is deactivated'
        });
      }

      // ✅ SECURE: bcrypt.compare is timing-attack resistant
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid credentials'
        });
      }

      const tokens = generateTokens(user.id, user.role, false);

      await storeSession(user.id, null, tokens, req.headers['user-agent'], req.ip);

      await pool.query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );

      // Don't send sensitive data
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
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken
        }
      });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to login'
        // Don't expose error details in production
      });
    }
  },

  // Customer Email Login
  customerEmailLogin: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          status: 'error',
          message: 'Email and password are required'
        });
      }

      if (!validateEmail(email)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid email format'
        });
      }

      const sanitizedEmail = sanitizeInput(email);

      // ✅ SECURE: Parameterized query
      let customer = await pool.query(
        'SELECT * FROM customers WHERE email = $1',
        [sanitizedEmail]
      );

      if (customer.rows.length === 0) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid credentials'
        });
      }

      customer = customer.rows[0];

      if (!customer.is_active) {
        return res.status(401).json({
          status: 'error',
          message: 'Account is deactivated'
        });
      }

      if (!customer.password) {
        return res.status(400).json({
          status: 'error',
          message: 'Please use Google login for this account'
        });
      }

      const isPasswordValid = await bcrypt.compare(password, customer.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid credentials'
        });
      }

      const tokens = generateTokens(customer.id, 'customer', true);

      await storeSession(null, customer.id, tokens, req.headers['user-agent'], req.ip);

      await pool.query(
        'UPDATE customers SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [customer.id]
      );

      res.json({
        status: 'success',
        message: 'Login successful',
        data: {
          customer: {
            id: customer.id,
            first_name: customer.first_name,
            last_name: customer.last_name,
            email: customer.email,
            phone: customer.phone
          },
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken
        }
      });
    } catch (error) {
      console.error('Customer login error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to login'
      });
    }
  },

  // Customer Email Registration
  customerEmailRegister: async (req, res) => {
    try {
      const { email, password, first_name, last_name, phone } = req.body;

      // Input validation
      if (!email || !password || !first_name) {
        return res.status(400).json({
          status: 'error',
          message: 'Email, password, and first name are required'
        });
      }

      if (!validateEmail(email)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid email format'
        });
      }

      if (!validatePassword(password)) {
        return res.status(400).json({
          status: 'error',
          message: 'Password must be at least 8 characters long'
        });
      }

      // Sanitize inputs
      const sanitizedEmail = sanitizeInput(email);
      const sanitizedFirstName = sanitizeInput(first_name);
      const sanitizedLastName = sanitizeInput(last_name || '');
      const sanitizedPhone = phone ? sanitizeInput(phone) : null;

      // Check for existing customer
      const existingCustomer = await pool.query(
        'SELECT id FROM customers WHERE email = $1',
        [sanitizedEmail]
      );

      if (existingCustomer.rows.length > 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Customer with this email already exists'
        });
      }

      // ✅ SECURE: Hash password with bcrypt (10 rounds)
      const hashedPassword = await bcrypt.hash(password, 10);

      const insertQuery = `
        INSERT INTO customers (first_name, last_name, email, phone, password)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, first_name, last_name, email, phone
      `;

      const result = await pool.query(insertQuery, [
        sanitizedFirstName,
        sanitizedLastName,
        sanitizedEmail,
        sanitizedPhone,
        hashedPassword
      ]);

      const customer = result.rows[0];

      const tokens = generateTokens(customer.id, 'customer', true);

      await storeSession(null, customer.id, tokens, req.headers['user-agent'], req.ip);

      res.status(201).json({
        status: 'success',
        message: 'Registration successful',
        data: {
          customer,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to register'
      });
    }
  },

  // Google Authentication
  googleAuth: async (req, res) => {
    try {
      const { email, name, googleId, picture } = req.body;

      if (!email || !googleId) {
        return res.status(400).json({
          status: 'error',
          message: 'Email and Google ID are required'
        });
      }

      if (!validateEmail(email)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid email format'
        });
      }

      const sanitizedEmail = sanitizeInput(email);
      const sanitizedName = sanitizeInput(name || '');
      const sanitizedGoogleId = sanitizeInput(googleId);

      let customer = await pool.query(
        'SELECT * FROM customers WHERE email = $1',
        [sanitizedEmail]
      );

      if (customer.rows.length === 0) {
        const nameParts = sanitizedName.split(' ');
        const firstName = sanitizeInput(nameParts[0] || '');
        const lastName = sanitizeInput(nameParts.slice(1).join(' ') || '');

        const insertQuery = `
          INSERT INTO customers (first_name, last_name, email, preferences)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `;

        const preferences = {
          auth_provider: 'google',
          google_id: sanitizedGoogleId,
          profile_picture: picture
        };

        customer = await pool.query(insertQuery, [
          firstName,
          lastName,
          sanitizedEmail,
          JSON.stringify(preferences)
        ]);
      } else {
        const existingPrefs = customer.rows[0].preferences || {};
        if (!existingPrefs.google_id) {
          await pool.query(
            'UPDATE customers SET preferences = $1 WHERE id = $2',
            [
              JSON.stringify({ 
                ...existingPrefs, 
                google_id: sanitizedGoogleId, 
                profile_picture: picture 
              }), 
              customer.rows[0].id
            ]
          );
        }
      }

      const customerData = customer.rows[0];

      const tokens = generateTokens(customerData.id, 'customer', true);

      await storeSession(null, customerData.id, tokens, req.headers['user-agent'], req.ip);

      await pool.query(
        'UPDATE customers SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [customerData.id]
      );

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
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken
        }
      });
    } catch (error) {
      console.error('Google auth error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to authenticate with Google'
      });
    }
  },

  // Refresh Token
  refreshToken: async (req, res) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          status: 'error',
          message: 'Refresh token is required'
        });
      }

      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

      const session = await pool.query(
        'SELECT * FROM user_sessions WHERE refresh_token = $1 AND expires_at > NOW()',
        [refreshToken]
      );

      if (session.rows.length === 0) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid or expired refresh token'
        });
      }

      const tokens = generateTokens(decoded.id, decoded.role, decoded.isCustomer);

      await pool.query(
        'UPDATE user_sessions SET token = $1, refresh_token = $2 WHERE id = $3',
        [tokens.accessToken, tokens.refreshToken, session.rows[0].id]
      );

      res.json({
        status: 'success',
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken
        }
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(401).json({
        status: 'error',
        message: 'Invalid refresh token'
      });
    }
  },

  // Logout
  logout: async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (token) {
        await pool.query('DELETE FROM user_sessions WHERE token = $1', [token]);
      }

      res.json({
        status: 'success',
        message: 'Logged out successfully'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to logout'
      });
    }
  },

  // Get Profile
  getProfile: async (req, res) => {
    try {
      res.json({
        status: 'success',
        data: { user: req.user }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch profile'
      });
    }
  }
};

module.exports = authController;