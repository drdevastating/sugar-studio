// backend/config/database.js - FIXED FOR NEON WITH PROPER SSL
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Use DB_URL if provided, otherwise construct from individual variables
const connectionConfig = process.env.DB_URL 
  ? {
      connectionString: process.env.DB_URL,
      ssl: {
        rejectUnauthorized: false
      }
    }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || 5432,
      ssl: {
        rejectUnauthorized: false
      }
    };

// Add connection pool settings
const pool = new Pool({
  ...connectionConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Connection event handlers
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err);
});

// Test connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection test failed:', err);
    console.error('Connection config:', {
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      port: process.env.DB_PORT,
      ssl: 'enabled'
    });
  } else {
    console.log('✅ Database connection test successful:', res.rows[0]);
  }
});

module.exports = pool;