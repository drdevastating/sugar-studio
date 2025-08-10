
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
// Load environment variables
dotenv.config();

// Import routes
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const customerRoutes = require('./routes/customerRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

// Import database connection
const pool = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Static files (for images, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
/*
When a browser or frontend app requests http://localhost:5000/uploads/image.jpg, it will look for and return the file:
backend/uploads/image.jpg
*/
app.get('/', (req, res) => {
  res.send('🍰 Welcome to Sweet Bakery API!');
});

// Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/categories', categoryRoutes);
/*
https://sweetcakes.com/ ← frontend React app
https://sweetcakes.com/gallery ← frontend route
https://sweetcakes.com/api/products ← backend API (hidden from user, used by frontend JS)
 */

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});
//Because Express recognizes this as an error-handling middleware only if it has 4 arguments

// 404 handler
// app.use('*', (req, res) => { // BKC ISKI WAJAH SE ITNA BADA ERROR AATA HAI
//   res.status(404).json({
//     status: 'error',
//     message: 'Route not found'
//   });
// });
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});
/*
404	Client error — Route not found	
500	Server error — Something broke
*/


// Run schema.sql on startup (once)
// async function initializeDatabase() {
//   try {
//     const schemaPath = path.join(__dirname, 'database', 'schema.sql');
//     const schema = fs.readFileSync(schemaPath, 'utf8');
//     await pool.query(schema);
//     console.log('✅ Database schema initialized');
//   } catch (error) {
//     console.error('❌ Failed to initialize schema:', error.message);
//   }
// }

// // Start the server
// initializeDatabase().then(() => {
//   app.listen(PORT, () => {
//     console.log(`🚀 Bakery server running on port ${PORT}`);
//   });
// });

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Bakery server running on port ${PORT}`);
});