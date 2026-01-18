// backend/server.js - FIXED FOR PRODUCTION
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables FIRST
dotenv.config();

// Validate critical environment variables
const requiredEnvVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DB_PASSWORD'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ FATAL ERROR: Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please check your environment variables');
  process.exit(1);
}

// Import security middleware
const {
  loginLimiter,
  registerLimiter,
  apiLimiter,
  sanitizeInput,
  validateContentType,
  preventParamPollution,
  securityHeaders,
  requestSizeLimiter,
  sqlInjectionDetector,
} = require('./middleware/security');

// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const customerRoutes = require('./routes/customerRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const cartRoutes = require('./routes/cartRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');

// Import database connection
const pool = require('./config/database');

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 3000;

// ============================================
// SECURITY MIDDLEWARE (Order matters!)
// ============================================

// 1. Security Headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://accounts.google.com"],
      imgSrc: ["'self'", "data:", "https:", "http:", "https://res.cloudinary.com"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'", "https://accounts.google.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(securityHeaders);

// 2. CORS - FIXED for production
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://sugar-studio.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin: ' + origin;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

// 3. Request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// 4. Request size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestSizeLimiter('10mb'));

// 5. Input sanitization and validation
app.use(sanitizeInput);
app.use(sqlInjectionDetector);
app.use(preventParamPollution);
app.use(validateContentType);

// 6. General API rate limiting
app.use('/api', apiLimiter);

// ============================================
// ROOT ROUTES
// ============================================

app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: '🍰 Welcome to Sugar Studio API!',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      categories: '/api/categories',
      customers: '/api/customers',
      orders: '/api/orders',
      cart: '/api/cart',
      recommendations: '/api/recommendations'
    }
  });
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await pool.query('SELECT 1');
    
    res.json({
      status: 'success',
      message: 'Server is running',
      database: 'connected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'error',
      message: 'Service unavailable',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================
// API ROUTES WITH RATE LIMITING
// ============================================

// Auth routes with specific rate limiting
app.use('/api/auth/admin/login', loginLimiter);
app.use('/api/auth/customer/login', loginLimiter);
app.use('/api/auth/customer/register', registerLimiter);
app.use('/api/auth', authRoutes);

// Other API routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/recommendations', recommendationRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.path
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Don't expose stack traces in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error',
    ...(isDevelopment && { stack: err.stack })
  });
});

// ============================================
// START SERVER
// ============================================

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log('🚀 Sugar Studio Server Started');
  console.log('='.repeat(50));
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`📍 API Base: http://localhost:${PORT}/api`);
  console.log(`📍 Allowed Origins:`, allowedOrigins);
  console.log('='.repeat(50));
  console.log('✅ Security Features:');
  console.log('  - Rate limiting enabled');
  console.log('  - SQL injection protection');
  console.log('  - XSS protection');
  console.log('  - CORS configured');
  console.log('  - Input sanitization');
  console.log('  - Security headers set');
  console.log('='.repeat(50));
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  server.close(() => {
    console.log('✅ HTTP server closed');
    
    pool.end(() => {
      console.log('✅ Database connections closed');
      console.log('👋 Server shut down successfully');
      process.exit(0);
    });
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('⚠️ Forcing shutdown...');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  gracefulShutdown('Unhandled Rejection');
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  gracefulShutdown('Uncaught Exception');
});

module.exports = app;