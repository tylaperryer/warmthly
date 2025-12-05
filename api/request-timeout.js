import logger from './logger.js';

const DEFAULT_TIMEOUT = 30000;

export function withTimeout(handler, timeoutMs = DEFAULT_TIMEOUT) {
  return async (req, res) => {
    const timeoutId = setTimeout(() => {
      if (!res.headersSent) {
        logger.error(`[request-timeout] Request timeout after ${timeoutMs}ms: ${req.method} ${req.url}`);
        res.status(504).json({ 
          error: { message: 'Request timeout. Please try again.' } 
        });
      }
    }, timeoutMs);

    try {
      const result = await handler(req, res);
      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      if (!res.headersSent) {
        throw error;
      }
    }
  };
}

