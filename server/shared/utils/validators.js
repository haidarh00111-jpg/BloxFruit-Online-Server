const { logger } = require('../logger');
const { getRedisClient } = require('../redis/client');
const { getPool } = require('../db/postgres');

class HealthCheck {
  static async checkRedis() {
    try {
      const redis = await getRedisClient();
      if (!redis) return { status: 'unavailable', message: 'Redis not initialized' };

      await redis.ping();
      return { status: 'healthy' };
    } catch (error) {
      return { status: 'unhealthy', message: error.message };
    }
  }

  static async checkPostgres() {
    try {
      const pool = getPool();
      if (!pool) return { status: 'unavailable', message: 'PostgreSQL not initialized' };

      const result = await pool.query('SELECT 1');
      if (result.rows.length > 0) {
        return { status: 'healthy' };
      }

      return { status: 'unhealthy', message: 'Query returned no rows' };
    } catch (error) {
      return { status: 'unhealthy', message: error.message };
    }
  }

  static async checkMemory() {
    const usage = process.memoryUsage();
    const heapPercent = (usage.heapUsed / usage.heapTotal) * 100;

    return {
      status: heapPercent < 90 ? 'healthy' : 'warning',
      heapUsedMB: Math.round(usage.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(usage.heapTotal / 1024 / 1024),
      percent: Math.round(heapPercent),
    };
  }

  static async getSystemHealth() {
    const [redis, postgres, memory] = await Promise.all([
      this.checkRedis(),
      this.checkPostgres(),
      this.checkMemory(),
    ]);

    const isHealthy =
      redis.status !== 'unhealthy' && postgres.status !== 'unhealthy' && memory.status !== 'unhealthy';

    return {
      status: isHealthy ? 'healthy' : 'degraded',
      redis,
      postgres,
      memory,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = { HealthCheck };
