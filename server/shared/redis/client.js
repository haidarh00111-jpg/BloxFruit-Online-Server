const redis = require('redis');
const { logger } = require('../logger');
const env = require('../config/env');

let client = null;

async function getRedisClient() {
  if (!client) {
    client = redis.createClient({
      socket: {
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
      },
      password: env.REDIS_PASSWORD || undefined,
      database: env.REDIS_DB,
    });

    client.on('error', (err) => logger.warn('Redis client error:', err.message));

    try {
      await client.connect();
      logger.info('Redis connected successfully');
    } catch (error) {
      logger.warn('Redis unavailable. Continuing in fallback mode:', error.message);
      client = null;
    }
  }

  return client;
}

module.exports = { getRedisClient };
