// Redis-based rate limiter for serverless functions
// Uses Redis for centralized, scalable rate limiting across multiple instances

import logger from './logger.js';
import { getRedisClient } from './redis-client.js';

// Redis-based rate limiting check
async function checkRateLimit(req, options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // limit each IP to max requests per windowMs
  } = options;

  // Get client identifier (IP address)
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
    
    // Use Redis INCR with expiration for rate limiting
    // This is atomic and handles expiration automatically
    const count = await client.incr(key);
    
    // Set expiration on first request (when count is 1)
    if (count === 1) {
      await client.pexpire(key, windowMs);
    }
    
    // Get TTL to calculate actual reset time
    const ttl = await client.pttl(key);
    const actualResetTime = now + (ttl > 0 ? ttl : windowMs);
    
    // Check if limit exceeded
    if (count > max) {
      return { 
        allowed: false, 
        remaining: 0, 
        resetTime: actualResetTime,
        retryAfter: Math.ceil(ttl / 1000)
      };
    }
    
    return { 
      allowed: true, 
      remaining: max - count, 
      resetTime: actualResetTime 
    };
  } catch (error) {
    // If Redis fails, log error but allow request (fail open)
    logger.error('[rate-limit] Redis error, allowing request:', error.message);
    return { allowed: true, remaining: max, resetTime: resetTime };
  }
}

// Wrapper function for rate limiting in Vercel serverless functions
export function withRateLimit(handler, options = {}) {
  return async (req, res) => {
    const result = await checkRateLimit(req, options);
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', options.max || 100);
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

// Pre-configured rate limit options for different endpoints
export const loginRateLimitOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
  message: 'Too many login attempts, please try again later.',
};

export const emailRateLimitOptions = {
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 emails per hour
  message: 'Too many email requests, please try again later.',
};

export const apiRateLimitOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: 'Too many requests, please try again later.',
};

