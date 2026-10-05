const { getRedisClient } = require('../redis/client');
const { logger } = require('../logger');

const LOCK_PREFIX = 'session:lock:';
const LOCK_TTL = 30;

class SessionLock {
  static async acquireLock(playerId, serverId, timeout = 5000) {
    const redis = await getRedisClient();
    const lockKey = `${LOCK_PREFIX}${playerId}`;
    const lockValue = `${serverId}:${Date.now()}`;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        if (redis) {
          const result = await redis.set(lockKey, lockValue, {
            EX: LOCK_TTL,
            NX: true,
          });

          if (result === 'OK') {
            return lockValue;
          }
        } else {
          return lockValue;
        }
      } catch (error) {
        logger.warn(`Lock acquisition failed for ${playerId}: ${error.message}`);
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    throw new Error(`Failed to acquire lock for ${playerId} after ${timeout}ms`);
  }

  static async releaseLock(playerId, lockValue) {
    const redis = await getRedisClient();
    const lockKey = `${LOCK_PREFIX}${playerId}`;

    try {
      if (redis) {
        const current = await redis.get(lockKey);
        if (current === lockValue) {
          await redis.del(lockKey);
        }
      }
    } catch (error) {
      logger.warn(`Lock release failed for ${playerId}: ${error.message}`);
    }
  }

  static async isLocked(playerId) {
    const redis = await getRedisClient();
    const lockKey = `${LOCK_PREFIX}${playerId}`;

    try {
      if (redis) {
        return (await redis.get(lockKey)) !== null;
      }
    } catch (error) {
      logger.warn(`Lock check failed for ${playerId}: ${error.message}`);
    }

    return false;
  }
}

module.exports = { SessionLock };
