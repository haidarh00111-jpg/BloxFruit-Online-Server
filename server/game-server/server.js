const crypto = require('crypto');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateSecureToken() {
  return crypto.randomBytes(32).toString('hex');
}

function verifyToken(token, hash) {
  return hashToken(token) === hash;
}

module.exports = {
  hashToken,
  generateSecureToken,
  verifyToken,
};
