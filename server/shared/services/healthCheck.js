const { logger } = require('../logger');
const { getPlayerProfile } = require('./playerRepository');

class RecoveryManager {
  static async recoverFromCrash(playerId, lastKnownData) {
    try {
      const profile = await getPlayerProfile(playerId);

      if (!profile) {
        logger.warn(`No recovery data found for ${playerId}. Using last known state.`);
        return lastKnownData || null;
      }

      const timeSinceLastSave = Date.now() - new Date(profile.lastOnline || profile.updatedAt || Date.now()).getTime();
      if (timeSinceLastSave > 300000) {
        logger.info(`Recovery data for ${playerId} is stale (${timeSinceLastSave}ms). Using as fallback.`);
      }

      return profile;
    } catch (error) {
      logger.error(`Recovery failed for ${playerId}: ${error.message}`);
      return lastKnownData || null;
    }
  }

  static async validatePlayerState(player) {
    if (!player) return false;

    const required = ['playerId', 'username'];
    const hasRequired = required.every((key) => player[key] !== undefined && player[key] !== null);

    if (!hasRequired) {
      logger.warn(`Invalid player state: missing required fields`, player);
      return false;
    }

    const numericFields = ['money', 'level', 'xp'];
    for (const field of numericFields) {
      if (player[field] !== undefined && (typeof player[field] !== 'number' || player[field] < 0)) {
        logger.warn(`Invalid player state: ${field} is invalid`, player);
        return false;
      }
    }

    return true;
  }
}

module.exports = { RecoveryManager };
