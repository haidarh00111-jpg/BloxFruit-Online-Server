const { logger } = require('../logger');
const { getPool } = require('./postgres');

async function ensureSchema() {
  const pool = getPool();
  if (!pool) return false;

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS players (
        player_id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        money INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        xp INTEGER DEFAULT 0,
        inventory JSONB DEFAULT '[]'::jsonb,
        world_name TEXT DEFAULT 'spawn',
        last_online TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS player_sessions (
        session_id TEXT PRIMARY KEY,
        player_id TEXT NOT NULL,
        server_id TEXT NOT NULL,
        token TEXT NOT NULL,
        connected_at TIMESTAMPTZ DEFAULT NOW(),
        disconnected_at TIMESTAMPTZ
      );
    `);

    logger.info('Database schema validated successfully');
    return true;
  } catch (error) {
    logger.warn('Database schema initialization failed:', error.message);
    return false;
  }
}

module.exports = { ensureSchema };
