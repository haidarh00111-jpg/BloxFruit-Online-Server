const { Pool } = require('pg');
const { logger } = require('../logger');
const env = require('../config/env');

let pool = null;

function getPool() {
  if (pool) return pool;

  if (process.env.DB_SKIP === 'true') {
    logger.warn('DB disabled via DB_SKIP=true');
    return null;
  }

  try {
    pool = new Pool({
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
      ssl: env.DB_SSL ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
    });

    pool.on('error', (err) => {
      logger.warn('Unexpected PostgreSQL client error:', err.message);
    });

    logger.info('PostgreSQL pool initialized');
    return pool;
  } catch (error) {
    logger.warn('PostgreSQL unavailable. Fallback mode enabled.', error.message);
    return null;
  }
}

module.exports = { getPool };
