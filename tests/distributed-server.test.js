const test = require('node:test');
const assert = require('node:assert/strict');
const { createGatewayServer } = require('../server/gateway/server');
const { createGameServer } = require('../server/game-server/server');
const { ServerRegistry } = require('../server/shared/store/serverRegistry');
const { savePlayerProfile, getPlayerProfile } = require('../server/shared/services/playerRepository');

test('Gateway selects the least loaded server', async () => {
  const registry = new ServerRegistry();
  registry.registerServer({ serverId: 'game-1', host: '127.0.0.1', port: 3001, maxPlayers: 120, currentPlayers: 90 });
  registry.registerServer({ serverId: 'game-2', host: '127.0.0.1', port: 3002, maxPlayers: 120, currentPlayers: 10 });

  const selected = registry.selectBestServer();
  assert.equal(selected.serverId, 'game-2');
});

test('Player profile can be saved and fetched', async () => {
  const player = {
    playerId: 'player-1001',
    username: 'sakura',
    money: 400,
    level: 7,
    xp: 1545,
    inventory: ['sword', 'fruit'],
    worldName: 'island-1',
  };

  await savePlayerProfile(player);
  const saved = await getPlayerProfile('player-1001');

  assert.ok(saved);
  assert.equal(saved.username, 'sakura');
  assert.equal(saved.money, 400);
  assert.equal(saved.worldName, 'island-1');
});

test('Gateway health endpoint responds successfully', async () => {
  const gateway = await createGatewayServer({ port: 4010, host: '127.0.0.1', skipHealthCheck: true });
  const response = await fetch('http://127.0.0.1:4010/health');
  const value = await response.json();

  assert.equal(response.status, 200);
  assert.equal(value.service, 'gateway');
  await new Promise((resolve, reject) => gateway.server.close((err) => (err ? reject(err) : resolve())));
});

test('Game server health endpoint responds successfully', async () => {
  const gameServer = await createGameServer({
    port: 4011,
    host: '127.0.0.1',
    serverId: 'game-test',
    maxPlayers: 50,
    skipGatewayRegistration: true,
  });

  const response = await fetch('http://127.0.0.1:4011/health');
  const value = await response.json();

  assert.equal(response.status, 200);
  assert.equal(value.service, 'game-server');
  await new Promise((resolve, reject) => gameServer.server.close((err) => (err ? reject(err) : resolve())));
});
