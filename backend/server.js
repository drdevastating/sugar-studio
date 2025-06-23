
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

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
app.use(morgan('combined')); // Logging
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Static files (for images, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
/*
When a browser or frontend app requests http://localhost:5000/uploads/image.jpg, it will look for and return the file:
backend/uploads/image.jpg
*/

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
//Because Express recognizes this as an error-handling middleware only if it has 4 arguments:

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});
/*
404	Client error — Route not found	
500	Server error — Something broke
*/


// Start server
app.listen(PORT, () => {
  console.log(`🚀 Bakery server running on port ${PORT}`);
});