// config/database.js
require('dotenv').config({ path: `${process.cwd()}/.env` });
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USERNAME,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: 5432, // default Postgres port, change if needed
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
