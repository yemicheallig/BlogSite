// config/db.js
const mysql = require('mysql2/promise');

// Create a connection pool using environment variables
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'blog_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection on startup
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL Database successfully.');
    connection.release();
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
  }
})();

module.exports = pool;