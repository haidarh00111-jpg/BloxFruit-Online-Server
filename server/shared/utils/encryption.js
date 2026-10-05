function validatePlayerId(playerId) {
  if (!playerId || typeof playerId !== 'string' || playerId.length === 0) {
    return { valid: false, error: 'Invalid playerId' };
  }
  if (playerId.length > 128) {
    return { valid: false, error: 'playerId too long' };
  }
  return { valid: true };
}

function validatePlayerData(data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid player data format' };
  }

  const required = ['playerId', 'username'];
  const missing = required.filter((key) => data[key] === undefined);
  if (missing.length > 0) {
    return { valid: false, error: `Missing fields: ${missing.join(', ')}` };
  }

  const numericFields = ['money', 'level', 'xp'];
  for (const field of numericFields) {
    if (data[field] !== undefined) {
      const val = Number(data[field]);
      if (!Number.isFinite(val) || val < 0 || val > Number.MAX_SAFE_INTEGER) {
        return { valid: false, error: `Invalid ${field}: must be non-negative number` };
      }
    }
  }

  if (Array.isArray(data.inventory)) {
    if (data.inventory.length > 1000) {
      return { valid: false, error: 'Inventory too large' };
    }
  }

  return { valid: true };
}

function validateMovement(movement) {
  if (!movement || typeof movement !== 'object') {
    return { valid: false, error: 'Invalid movement data' };
  }

  const { x, y, z, worldName } = movement;
  if (typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number') {
    return { valid: false, error: 'Invalid position coordinates' };
  }

  const isWithinBounds = (val) => Number.isFinite(val) && val > -1e6 && val < 1e6;
  if (!isWithinBounds(x) || !isWithinBounds(y) || !isWithinBounds(z)) {
    return { valid: false, error: 'Coordinates out of bounds' };
  }

  if (worldName && (typeof worldName !== 'string' || worldName.length > 128)) {
    return { valid: false, error: 'Invalid worldName' };
  }

  return { valid: true };
}

module.exports = {
  validatePlayerId,
  validatePlayerData,
  validateMovement,
};
