const dotenv = require('dotenv');
dotenv.config();

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  GATEWAY_PORT: toNumber(process.env.GATEWAY_PORT, 3000),
  GATEWAY_HOST: process.env.GATEWAY_HOST || '0.0.0.0',
  SERVER_ID: process.env.SERVER_ID || 'game-1',
  GAME_SERVER_PORT: toNumber(process.env.GAME_SERVER_PORT, 3001),
  GAME_SERVER_HOST: process.env.GAME_SERVER_HOST || '0.0.0.0',
  GAME_SERVER_MAX_PLAYERS: toNumber(process.env.GAME_SERVER_MAX_PLAYERS, 120),
  GAME_SERVER_HEARTBEAT_INTERVAL: toNumber(process.env.GAME_SERVER_HEARTBEAT_INTERVAL, 5000),
  GATEWAY_URL: process.env.GATEWAY_URL || 'http://localhost:3000',
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: toNumber(process.env.REDIS_PORT, 6379),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
  REDIS_DB: toNumber(process.env.REDIS_DB, 0),
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: toNumber(process.env.DB_PORT, 5432),
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || 'postgres',
  DB_NAME: process.env.DB_NAME || 'bloxfruit',
  DB_SSL: (process.env.DB_SSL || 'false').toLowerCase() === 'true',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};
