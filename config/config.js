require('dotenv').config({ path: `${process.cwd()}/.env` });
const { Pool } = require('pg');

// Database configuration
const dbConfig = {
  "development": {
    "username": process.env.DB_USERNAME,
    "password": process.env.DB_PASSWORD,
    "database": process.env.DB_NAME,
    "host": process.env.DB_HOST,
    "dialect": "postgres"
  },
  "test": {
    "username": "root",
    "password": null,
    "database": "database_test",
    "host": "127.0.0.1",
    "dialect": "mysql"
  },
  "production": {
    "username": "root",
    "password": null,
    "database": "database_production",
    "host": "127.0.0.1",
    "dialect": "mysql"
  }
};

// Create PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USERNAME,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle
  connectionTimeoutMillis: 2000, // How long to wait for a connection
});

// Create a query function that converts ? placeholders to PostgreSQL $1, $2, etc.
const query = async (text, params = []) => {
  try {
    // Convert MySQL-style ? placeholders to PostgreSQL $1, $2, etc.
    let pgQuery = text;
    let paramIndex = 1;
    while (pgQuery.includes('?')) {
      pgQuery = pgQuery.replace('?', `${paramIndex}`);
      paramIndex++;
    }
    
    const start = Date.now();
    const res = await pool.query(pgQuery, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text: pgQuery, duration, rows: res.rowCount });
    return res.rows; // Return just the rows to match your current code
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Test the connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err);
});

// Export both the config and the query function
module.exports = {
  ...dbConfig,
  query,
  pool
};