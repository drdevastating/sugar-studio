// backend/middleware/security.js - Comprehensive Security Middleware
const rateLimit = require('express-rate-limit');

// Rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    status: 'error',
    message: 'Too many login attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for registration
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour per IP
  message: {
    status: 'error',
    message: 'Too many accounts created. Please try again after an hour.'
  }
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    status: 'error',
    message: 'Too many requests. Please try again later.'
  }
});

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      // Remove potential XSS characters
      return obj
        .trim()
        .replace(/[<>]/g, '') // Remove < and >
        .substring(0, 1000); // Limit length
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

// Validate content type for POST/PUT requests
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

// Prevent parameter pollution
const preventParamPollution = (req, res, next) => {
  const checkPollution = (obj) => {
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        if (Array.isArray(obj[key]) && obj[key].length > 1) {
          // Keep only the first value if array detected (potential pollution)
          obj[key] = obj[key][0];
        }
      });
    }
  };

  checkPollution(req.query);
  checkPollution(req.body);
  next();
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Remove powered by header
  res.removeHeader('X-Powered-By');
  
  next();
};

// Request size limiter
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

// SQL injection detection (additional layer)
const sqlInjectionDetector = (req, res, next) => {
  const detectSQLInjection = (str) => {
    if (typeof str !== 'string') return false;
    
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

// CORS configuration
const configureCORS = () => {
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL]
    : ['http://localhost:5173', 'http://localhost:3000'];

  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
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