// backend/server.js - SECURED VERSION
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
  console.error('Please check your .env file');
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
  configureCORS
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
      imgSrc: ["'self'", "data:", "https:", "http:"],
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

// 2. CORS - Properly configured
app.use(cors(configureCORS()));

// 3. Request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined')); // Use proper logging in production
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

// Static files (for uploaded images, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
    res.status(503).json({
      status: 'error',
      message: 'Service unavailable',
      database: 'disconnected',
      timestamp: new Date().toISOString()
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

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend is running 🚀'
  });
});

const server = app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('🚀 Sugar Studio Server Started');
  console.log('='.repeat(50));
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`📍 API Base: http://localhost:${PORT}/api`);
  console.log(`📁 Static Files: ${path.join(__dirname, 'uploads')}`);
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

module.exports = app; // For testing purposes