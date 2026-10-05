const { logger } = require('../logger');
const { getPool } = require('./postgres');
const { getRedisClient } = require('../redis/client');

const MEMORY_PLAYERS = new Map();
const MEMORY_SESSIONS = new Map();

async function savePlayerProfile(player) {
  const normalized = {
    player_id: player.playerId || player.player_id,
    username: player.username || 'unknown',
    money: Number(player.money || 0),
    level: Number(player.level || 1),
    xp: Number(player.xp || 0),
    inventory: Array.isArray(player.inventory) ? player.inventory : [],
    world_name: player.worldName || player.world_name || 'spawn',
    last_online: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const pool = getPool();
  if (pool) {
    try {
      await pool.query(
        `
          INSERT INTO players (player_id, username, money, level, xp, inventory, world_name, last_online, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, NOW(), NOW())
          ON CONFLICT (player_id)
          DO UPDATE SET
            username = EXCLUDED.username,
            money = EXCLUDED.money,
            level = EXCLUDED.level,
            xp = EXCLUDED.xp,
            inventory = EXCLUDED.inventory,
            world_name = EXCLUDED.world_name,
            last_online = NOW(),
            updated_at = NOW();
        `,
        [
          normalized.player_id,
          normalized.username,
          normalized.money,
          normalized.level,
          normalized.xp,
          JSON.stringify(normalized.inventory),
          normalized.world_name,
        ]
      );
      return { ...player, ...normalized, playerId: normalized.player_id };
    } catch (error) {
      logger.warn(`Failed to save player ${normalized.player_id} to PostgreSQL: ${error.message}`);
    }
  }

  MEMORY_PLAYERS.set(normalized.player_id, normalized);
  return { ...player, ...normalized, playerId: normalized.player_id };
}

async function getPlayerProfile(playerId) {
  const pool = getPool();
  if (pool) {
    try {
      const result = await pool.query('SELECT * FROM players WHERE player_id = $1', [playerId]);
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      return {
        playerId: row.player_id,
        username: row.username,
        money: Number(row.money),
        level: Number(row.level),
        xp: Number(row.xp),
        inventory: Array.isArray(row.inventory) ? row.inventory : JSON.parse(row.inventory || '[]'),
        worldName: row.world_name,
        lastOnline: row.last_online,
      };
    } catch (error) {
      logger.warn(`Failed to load player ${playerId} from PostgreSQL: ${error.message}`);
    }
  }

  return MEMORY_PLAYERS.get(playerId) || null;
}

async function savePlayerSession(session) {
  const redis = await getRedisClient();
  const payload = JSON.stringify(session);

  if (redis) {
    try {
      await redis.set(`session:${session.playerId}`, payload, { EX: 3600 });
    } catch (error) {
      logger.warn(`Redis session save failed for ${session.playerId}: ${error.message}`);
    }
  }

  MEMORY_SESSIONS.set(session.playerId, session);
  return session;
}

async function getPlayerSession(playerId) {
  const redis = await getRedisClient();

  if (redis) {
    try {
      const value = await redis.get(`session:${playerId}`);
      if (value) return JSON.parse(value);
    } catch (error) {
      logger.warn(`Redis session lookup failed for ${playerId}: ${error.message}`);
    }
  }

  return MEMORY_SESSIONS.get(playerId) || null;
}

async function deletePlayerSession(playerId) {
  const redis = await getRedisClient();
  if (redis) {
    try {
      await redis.del(`session:${playerId}`);
    } catch (error) {
      logger.warn(`Redis session delete failed for ${playerId}: ${error.message}`);
    }
  }

  MEMORY_SESSIONS.delete(playerId);
  return true;
}

module.exports = {
  savePlayerProfile,
  getPlayerProfile,
  savePlayerSession,
  getPlayerSession,
  deletePlayerSession,
};
