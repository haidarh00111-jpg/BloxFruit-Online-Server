const { logger } = require('../logger');

class RetryHandler {
  static async withRetry(fn, options = {}) {
    const { maxAttempts = 3, delayMs = 100, backoff = 1.5, timeout = 10000 } = options;
    let lastError;
    let delay = delayMs;
    const startTime = Date.now();

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (Date.now() - startTime > timeout) {
        throw new Error(`Operation timed out after ${timeout}ms`);
      }

      try {
        return await Promise.race([
          fn(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Operation timed out')), timeout - (Date.now() - startTime))
          ),
        ]);
      } catch (error) {
        lastError = error;
        logger.debug(`Attempt ${attempt}/${maxAttempts} failed: ${error.message}`);

        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay = Math.min(delay * backoff, 5000);
        }
      }
    }

    throw lastError || new Error('Operation failed after all retries');
  }
}

module.exports = { RetryHandler };
