const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test the database connection
pool.getConnection()
  .then(conn => {
    console.log('Database connection successful.');
    conn.release();
  })
  .catch(err => {
    console.error('Database connection failed:', err.message);
    console.error('Please check your database configuration in .env file');
    // Don't exit process, just log the error
  });

module.exports = pool;