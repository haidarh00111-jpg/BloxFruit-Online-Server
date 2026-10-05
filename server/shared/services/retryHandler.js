const { getRedisClient } = require('../redis/client');
const { getPlayerProfile } = require('./playerRepository');
const { logger } = require('../logger');

const CONFLICT_RESOLUTION_TTL = 300;
const CONFLICT_PREFIX = 'conflict:';

class ConflictResolver {
  static async preventDuplicateSessions(playerId, newServerId) {
    const redis = await getRedisClient();
    const existingProfile = await getPlayerProfile(playerId);

    if (!existingProfile) {
      return { allowed: true, action: 'new_session' };
    }

    const conflictKey = `${CONFLICT_PREFIX}${playerId}`;

    if (redis) {
      try {
        const existing = await redis.get(conflictKey);
        if (existing) {
          const parsed = JSON.parse(existing);
          if (parsed.serverId === newServerId) {
            return { allowed: true, action: 'same_server' };
          }

          logger.warn(
            `Duplicate session detected for ${playerId}: existing=${parsed.serverId}, new=${newServerId}`
          );
          return { allowed: false, action: 'reject', reason: 'Session already active on another server' };
        }

        await redis.set(
          conflictKey,
          JSON.stringify({
            playerId,
            serverId: newServerId,
            timestamp: Date.now(),
          }),
          { EX: CONFLICT_RESOLUTION_TTL }
        );

        return { allowed: true, action: 'new_session' };
      } catch (error) {
        logger.warn(`Conflict check failed for ${playerId}: ${error.message}`);
        return { allowed: true, action: 'fallback' };
      }
    }

    return { allowed: true, action: 'fallback' };
  }

  static async clearConflict(playerId) {
    const redis = await getRedisClient();
    if (redis) {
      try {
        await redis.del(`${CONFLICT_PREFIX}${playerId}`);
      } catch (error) {
        logger.warn(`Failed to clear conflict for ${playerId}: ${error.message}`);
      }
    }
  }

  static async getActiveSession(playerId) {
    const redis = await getRedisClient();
    if (redis) {
      try {
        const value = await redis.get(`${CONFLICT_PREFIX}${playerId}`);
        return value ? JSON.parse(value) : null;
      } catch (error) {
        logger.warn(`Failed to get active session for ${playerId}: ${error.message}`);
      }
    }
    return null;
  }
}

module.exports = { ConflictResolver };
