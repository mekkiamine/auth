// Require pg package for PostgreSQL
const { Pool } = require('pg');

// Create a new pool instance and configure your database connection
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'calendar_test',
    password: '1234',
    port: 5432,
    max: 100, // Maximum number of clients in the pool
    idleTimeoutMillis: 5000, // Close idle clients after 5 seconds
    connectionTimeoutMillis: 2000,
  });

  module.exports = {pool}