const levels = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const currentLevel = levels[(process.env.LOG_LEVEL || 'info').toLowerCase()] || levels.info;

function log(level, ...args) {
  if ((levels[level] || levels.info) < currentLevel) return;
  const prefix = `[${new Date().toISOString()}] [${level.toUpperCase()}]`;
  console.log(prefix, ...args);
}

module.exports = {
  logger: {
    debug: (...args) => log('debug', ...args),
    info: (...args) => log('info', ...args),
    warn: (...args) => log('warn', ...args),
    error: (...args) => log('error', ...args),
  },
};
