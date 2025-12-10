import logger from './logger.js';
import { getRedisClient } from './redis-client.js';

const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_MAX = 100;

async function checkRateLimit(req, options = {}) {
  const {
    windowMs = DEFAULT_WINDOW_MS,
    max = DEFAULT_MAX,
  } = options;

  const identifier = 
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    'unknown';

  const key = `ratelimit:${identifier}:${req.url}`;
  const now = Date.now();
  const resetTime = now + windowMs;

  try {
    const client = await getRedisClient();
    
    const pipeline = client.pipeline();
    pipeline.incr(key);
    pipeline.pttl(key);
    const results = await pipeline.exec();
    
    const count = results[0][1];
    const ttl = results[1][1];
    
    if (count === 1) {
      await client.pexpire(key, windowMs);
    } else if (ttl === -1) {
      await client.pexpire(key, windowMs);
    }
    
    const actualTtl = await client.pttl(key);
    const actualResetTime = now + (actualTtl > 0 ? actualTtl : windowMs);
    
    if (count > max) {
      return { 
        allowed: false, 
        remaining: 0, 
        resetTime: actualResetTime,
        retryAfter: Math.ceil((ttl > 0 ? ttl : windowMs) / 1000)
      };
    }
    
    return { 
      allowed: true, 
      remaining: max - count, 
      resetTime: actualResetTime 
    };
  } catch (error) {
    logger.error('[rate-limit] Redis error, allowing request:', error.message);
    return { allowed: true, remaining: max, resetTime: resetTime };
  }
}

export function withRateLimit(handler, options = {}) {
  return async (req, res) => {
    const result = await checkRateLimit(req, options);
    
    res.setHeader('X-RateLimit-Limit', options.max || DEFAULT_MAX);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

    if (!result.allowed) {
      res.setHeader('Retry-After', result.retryAfter);
      return res.status(429).json({ 
        error: { message: options.message || 'Too many requests, please try again later.' }
      });
    }

    return handler(req, res);
  };
}

export const loginRateLimitOptions = {
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later.',
};

export const emailRateLimitOptions = {
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many email requests, please try again later.',
};

export const apiRateLimitOptions = {
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.',
};

export const voteRateLimitOptions = {
  windowMs: 30 * 24 * 60 * 60 * 1000,
  max: 1,
  message: 'You have already voted. Please wait before voting again.',
};

