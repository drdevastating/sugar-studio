// backend/middleware/security.js - FIXED to allow Google OAuth
// Place this file at: backend/middleware/security.js
const rateLimit = require('express-rate-limit');

// Rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    status: 'error',
    message: 'Too many login attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    status: 'error',
    message: 'Too many accounts created. Please try again after an hour.'
  }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    status: 'error',
    message: 'Too many requests. Please try again later.'
  }
});

const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj
        .trim()
        .replace(/[<>]/g, '')
        .substring(0, 1000);
    }
    if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        obj[key] = sanitize(obj[key]);
      });
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }
  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
};

const validateContentType = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
      if (!contentType || !contentType.includes('multipart/form-data')) {
        return res.status(400).json({
          status: 'error',
          message: 'Content-Type must be application/json'
        });
      }
    }
  }
  next();
};

const preventParamPollution = (req, res, next) => {
  const checkPollution = (obj) => {
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        if (Array.isArray(obj[key]) && obj[key].length > 1) {
          obj[key] = obj[key][0];
        }
      });
    }
  };

  checkPollution(req.query);
  checkPollution(req.body);
  next();
};

const securityHeaders = (req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.removeHeader('X-Powered-By');
  next();
};

const requestSizeLimiter = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = req.get('content-length');
    if (contentLength) {
      const sizeMB = parseInt(contentLength) / (1024 * 1024);
      const maxSizeMB = parseInt(maxSize);
      if (sizeMB > maxSizeMB) {
        return res.status(413).json({
          status: 'error',
          message: `Request too large. Maximum size is ${maxSize}`
        });
      }
    }
    next();
  };
};

// FIXED: Updated to exclude Google OAuth routes and allow JWT tokens
const sqlInjectionDetector = (req, res, next) => {
  // Skip SQL injection check for Google OAuth endpoint
  if (req.path === '/api/auth/customer/google') {
    return next();
  }

  const detectSQLInjection = (str) => {
    if (typeof str !== 'string') return false;
    
    // Don't flag JWT tokens or base64 encoded strings
    if (str.match(/^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/)) {
      return false; // This is likely a JWT token
    }
    
    if (str.match(/^[A-Za-z0-9+/=]+$/)) {
      return false; // This is likely base64
    }
    
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
      /(--|\#|\/\*|\*\/)/,
      /(\bOR\b.*=.*)/i,
      /(\bAND\b.*=.*)/i,
      /(;.*--)/,
      /(UNION.*SELECT)/i
    ];
    
    return sqlPatterns.some(pattern => pattern.test(str));
  };

  const checkObject = (obj) => {
    if (typeof obj === 'string') {
      if (detectSQLInjection(obj)) {
        return true;
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (let key in obj) {
        // Skip checking certain fields that might contain tokens
        if (key === 'googleId' || key === 'picture' || key === 'credential') {
          continue;
        }
        if (checkObject(obj[key])) {
          return true;
        }
      }
    }
    return false;
  };

  if (checkObject(req.body) || checkObject(req.query) || checkObject(req.params)) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid input detected'
    });
  }

  next();
};

const configureCORS = () => {
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [
        process.env.FRONTEND_URL,
        'https://sugar-studio.vercel.app',
        'https://accounts.google.com' // Allow Google OAuth
      ].filter(Boolean)
    : ['http://localhost:5173', 'http://localhost:3000', 'https://accounts.google.com'];

  return {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
    optionsSuccessStatus: 200
  };
};

module.exports = {
  loginLimiter,
  registerLimiter,
  apiLimiter,
  sanitizeInput,
  validateContentType,
  preventParamPollution,
  securityHeaders,
  requestSizeLimiter,
  sqlInjectionDetector,
  configureCORS
};