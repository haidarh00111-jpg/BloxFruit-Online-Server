class ServerRegistry {
  constructor() {
    this.servers = new Map();
  }

  registerServer(server) {
    const normalized = {
      serverId: server.serverId,
      host: server.host || '0.0.0.0',
      port: Number(server.port || 3001),
      maxPlayers: Number(server.maxPlayers || 120),
      currentPlayers: Number(server.currentPlayers || 0),
      status: server.status || 'online',
      lastHeartbeat: Date.now(),
      region: server.region || 'default',
    };

    this.servers.set(normalized.serverId, normalized);
    return normalized;
  }

  updateHeartbeat(serverId, payload = {}) {
    const existing = this.servers.get(serverId);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...payload,
      currentPlayers: Number(payload.currentPlayers ?? existing.currentPlayers),
      maxPlayers: Number(payload.maxPlayers ?? existing.maxPlayers),
      lastHeartbeat: Date.now(),
      status: payload.status || 'online',
    };

    this.servers.set(serverId, updated);
    return updated;
  }

  removeServer(serverId) {
    this.servers.delete(serverId);
  }

  listServers() {
    return [...this.servers.values()].filter((server) => server.status !== 'offline');
  }

  selectBestServer() {
    const activeServers = this.listServers().filter((server) => server.currentPlayers < server.maxPlayers);
    if (activeServers.length === 0) return null;
    return activeServers.sort((a, b) => {
      const loadA = a.currentPlayers / a.maxPlayers;
      const loadB = b.currentPlayers / b.maxPlayers;
      return loadA - loadB;
    })[0];
  }

  getServer(serverId) {
    return this.servers.get(serverId) || null;
  }
}

module.exports = { ServerRegistry, createRegistry: () => new ServerRegistry() };
