const { logger } = require('../logger');
const { savePlayerProfile } = require('./playerRepository');
const { RetryHandler } = require('./retryHandler');

class DataSync {
  constructor() {
    this.activeSessions = new Map();
    this.saveQueues = new Map();
  }

  startAutoSave(playerId, serverId) {
    if (this.activeSessions.has(playerId)) {
      return;
    }

    const interval = setInterval(async () => {
      await this.flushPlayerData(playerId);
    }, 30000);

    this.activeSessions.set(playerId, { serverId, interval });
    logger.debug(`Auto-save started for ${playerId}`);
  }

  stopAutoSave(playerId) {
    const session = this.activeSessions.get(playerId);
    if (session) {
      clearInterval(session.interval);
      this.activeSessions.delete(playerId);
      logger.debug(`Auto-save stopped for ${playerId}`);
    }
  }

  async queueSave(playerId, playerData) {
    if (!this.saveQueues.has(playerId)) {
      this.saveQueues.set(playerId, []);
    }

    const queue = this.saveQueues.get(playerId);
    queue.push({ ...playerData, timestamp: Date.now() });

    if (queue.length >= 5) {
      await this.flushPlayerData(playerId);
    }
  }

  async flushPlayerData(playerId) {
    const queue = this.saveQueues.get(playerId);
    if (!queue || queue.length === 0) return;

    try {
      const latestData = queue[queue.length - 1];
      await RetryHandler.withRetry(
        () => savePlayerProfile(latestData),
        { maxAttempts: 3, delayMs: 100 }
      );
      this.saveQueues.delete(playerId);
      logger.debug(`Flushed ${queue.length} save(s) for ${playerId}`);
    } catch (error) {
      logger.error(`Failed to flush saves for ${playerId}: ${error.message}`);
    }
  }

  async emergencySave(playerId, playerData) {
    await this.flushPlayerData(playerId);
    if (playerData) {
      await savePlayerProfile(playerData);
    }
  }
}

module.exports = { DataSync };
