// backend/db.js
const { Pool } = require('pg');
require('dotenv').config();

let pool;

if (process.env.DATABASE_URL) {
  // 🌍 Cloud database (Neon / Production)
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  // 💻 Local database (Development fallback)
  pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    port: process.env.PGPORT || 5432,
  });
}

// Test DB connection on startup
pool.connect()
  .then(client => {
    console.log(`✅ CONNECTED TO PostgreSQL DATABASE SUCCESSFULLY ${process.env.PGDATABASE || 'default'}`);
    client.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
  });

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
