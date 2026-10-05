const express = require('express');
const http = require('http');
const crypto = require('crypto');
const { logger } = require('../shared/logger');
const env = require('../shared/config/env');
const { createRegistry } = require('../shared/store/serverRegistry');
const { getRedisClient } = require('../shared/redis/client');

async function createGatewayServer(options = {}) {
  const app = express();
  const registry = createRegistry();
  const port = options.port || env.GATEWAY_PORT;
  const host = options.host || env.GATEWAY_HOST;

  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'gateway',
      serversRegistered: registry.listServers().length,
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/servers', (req, res) => {
    res.json({
      servers: registry.listServers(),
      count: registry.listServers().length,
    });
  });

  app.post('/register-server', async (req, res) => {
    const { serverId, host: serverHost, port: serverPort, maxPlayers, currentPlayers = 0 } = req.body || {};

    if (!serverId) {
      return res.status(400).json({ error: 'serverId is required' });
    }

    const server = registry.registerServer({
      serverId,
      host: serverHost || '0.0.0.0',
      port: serverPort || 3001,
      maxPlayers: maxPlayers || 120,
      currentPlayers,
      status: 'online',
    });

    logger.info(`Game server registered: ${serverId} (${server.host}:${server.port})`);
    res.json({ ok: true, server });
  });

  app.post('/heartbeat', async (req, res) => {
    const { serverId } = req.body || {};
    if (!serverId) {
      return res.status(400).json({ error: 'serverId is required' });
    }

    const heartbeat = registry.updateHeartbeat(serverId, req.body || {});
    if (!heartbeat) {
      return res.status(404).json({ error: 'Game server not found, registration needed' });
    }

    res.json({ ok: true, heartbeat });
  });

  app.post('/auth/login', async (req, res) => {
    const playerId = req.body?.playerId || req.body?.username || `guest-${Date.now()}`;
    const server = registry.selectBestServer();

    if (!server) {
      return res.status(503).json({
        error: 'No available game server at the moment',
        retryAfterSeconds: 5,
      });
    }

    const token = crypto.randomUUID();
    const session = {
      playerId,
      serverId: server.serverId,
      token,
      createdAt: new Date().toISOString(),
    };

    try {
      const redis = await getRedisClient();
      if (redis) {
        await redis.set(`gateway:session:${token}`, JSON.stringify(session), { EX: 1800 });
      }
    } catch (error) {
      logger.warn('Failed to cache gateway session in Redis:', error.message);
    }

    res.json({
      ok: true,
      token,
      playerId,
      server: {
        serverId: server.serverId,
        host: server.host,
        port: server.port,
        wsUrl: `ws://${server.host}:${server.port}/ws?token=${token}&playerId=${encodeURIComponent(playerId)}`,
      },
    });
  });

  app.post('/auth/logout', async (req, res) => {
    const { token } = req.body || {};
    if (!token) {
      return res.status(400).json({ error: 'token is required' });
    }

    try {
      const redis = await getRedisClient();
      if (redis) {
        await redis.del(`gateway:session:${token}`);
      }
      res.json({ ok: true, message: 'Session deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Unable to delete session' });
    }
  });

  const serverInstance = http.createServer(app);

  await new Promise((resolve, reject) => {
    serverInstance.once('error', reject);
    serverInstance.listen(port, host, () => {
      logger.info(`Gateway server running on ${host}:${port}`);
      resolve();
    });
  });

  return { app, server: serverInstance, registry };
}

if (require.main === module) {
  createGatewayServer().catch((error) => {
    logger.error('Gateway failed to start:', error.message);
    process.exit(1);
  });
}

module.exports = { createGatewayServer };
