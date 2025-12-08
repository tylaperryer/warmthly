/**
 * Rate Limiting Middleware
 * Provides Redis-based rate limiting for API endpoints
 * Implements sliding window rate limiting algorithm
 */

import logger from '../utils/logger.js';
import { getRedisClient } from '../utils/redis-client.js';

/**
 * Default rate limit configuration
 */
const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const DEFAULT_MAX = 100; // 100 requests per window

/**
 * Rate limit failure mode
 */
export enum RateLimitFailureMode {
  /** Fail open: Allow requests if Redis fails (default for non-critical endpoints) */
  FAIL_OPEN = 'fail_open',
  /** Fail closed: Reject requests if Redis fails (for critical endpoints) */
  FAIL_CLOSED = 'fail_closed',
  /** Degraded: Use in-memory fallback with stricter limits if Redis fails */
  DEGRADED = 'degraded',
}

/**
 * Rate limit options
 */
export interface RateLimitOptions {
  readonly windowMs?: number;
  readonly max?: number;
  readonly message?: string;
  /** Failure mode when Redis is unavailable (default: FAIL_OPEN) */
  readonly failureMode?: RateLimitFailureMode;
  /** In-memory fallback limits for degraded mode (stricter than Redis limits) */
  readonly degradedMax?: number;
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly resetTime: number;
  readonly retryAfter?: number;
}

/**
 * Request object interface
 */
export interface Request {
  readonly method: string;
  readonly url: string;
  readonly headers: {
    readonly 'x-forwarded-for'?: string;
    readonly 'x-real-ip'?: string;
    [key: string]: string | undefined;
  };
  readonly connection?: {
    readonly remoteAddress?: string;
  };
  readonly query?: Record<string, string | string[] | undefined>;
  readonly body?: unknown;
  readonly on?: (event: string, listener: (...args: unknown[]) => void) => void;
  [key: string]: unknown;
}

/**
 * Response object interface
 */
export interface Response {
  status: (code: number) => Response;
  json: (data: unknown) => Response;
  setHeader: (name: string, value: string | number) => void;
  [key: string]: unknown;
}

/**
 * Request handler type
 */
type RequestHandler = (req: Request, res: Response) => Promise<unknown> | unknown;

/**
 * Get client identifier from request
 * Uses IP address from headers or connection
 *
 * @param req - Request object
 * @returns Client identifier string
 */
function getClientIdentifier(req: Request): string {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // Get first IP from X-Forwarded-For header
    const firstIp = forwardedFor.split(',')[0]?.trim();
    if (firstIp) {
      return firstIp;
    }
  }

  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return realIp;
  }

  const remoteAddress = req.connection?.remoteAddress;
  if (remoteAddress) {
    return remoteAddress;
  }

  return 'unknown';
}

/**
 * Check rate limit for a request
 *
 * @param req - Request object
 * @param options - Rate limit options
 * @returns Rate limit result
 */
async function checkRateLimit(
  req: Request,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
  const max = options.max ?? DEFAULT_MAX;

  const identifier = getClientIdentifier(req);
  const key = `ratelimit:${identifier}:${req.url}`;
  const now = Date.now();
  const resetTime = now + windowMs;

  try {
    const client = await getRedisClient();

    // Use multi for atomic operations
    const multi = client.multi();
    multi.incr(key);
    multi.pTTL(key);
    const results = await multi.exec();

    if (!results || results.length < 2) {
      throw new Error('Redis pipeline execution failed');
    }

    // Results are in format: [error, value] or just value
    const countResult = results[0];
    const ttlResult = results[1];
    
    // Handle both tuple format [error, value] and direct value format
    const count = Array.isArray(countResult) ? countResult[1] : countResult;
    const ttl = Array.isArray(ttlResult) ? ttlResult[1] : ttlResult;

    if (typeof count !== 'number' || typeof ttl !== 'number') {
      throw new Error('Invalid Redis response');
    }

    // Set expiration if this is the first request or key has no TTL
    if (count === 1) {
      await client.pExpire(key, windowMs);
    } else if (ttl === -1) {
      await client.pExpire(key, windowMs);
    }

    // Get actual TTL
    const actualTtl = await client.pTTL(key);
    const actualResetTime = now + (actualTtl > 0 ? actualTtl : windowMs);

    if (count > max) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: actualResetTime,
        retryAfter: Math.ceil((ttl > 0 ? ttl : windowMs) / 1000),
      };
    }

    return {
      allowed: true,
      remaining: max - count,
      resetTime: actualResetTime,
    };
  } catch (error: unknown) {
    // Handle Redis errors based on failure mode
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('[rate-limit] Redis error:', errorMessage);

    // Failure mode is determined by options, default to FAIL_OPEN for backward compatibility
    const failureMode = options.failureMode ?? RateLimitFailureMode.FAIL_OPEN;

    if (failureMode === RateLimitFailureMode.FAIL_CLOSED) {
      // Fail closed: Reject request
      logger.error('[rate-limit] Redis unavailable, rejecting request (fail-closed mode)');
      return {
        allowed: false,
        remaining: 0,
        resetTime: resetTime,
        retryAfter: Math.ceil(windowMs / 1000),
      };
    } else if (failureMode === RateLimitFailureMode.DEGRADED) {
      // Degraded mode: Use in-memory fallback with stricter limits
      const degradedMax = options.degradedMax ?? Math.max(1, Math.floor(max / 10)); // 10% of normal limit
      logger.warn(`[rate-limit] Redis unavailable, using degraded mode (limit: ${degradedMax})`);

      // Simple in-memory rate limiting (per-process, not distributed)
      // In production, consider using a shared in-memory store or stricter limits
      const memoryKey = `memory:ratelimit:${identifier}:${req.url}`;
      const memoryStore =
        (globalThis as { rateLimitStore?: Map<string, { count: number; resetTime: number }> })
          .rateLimitStore ?? new Map();

      if (
        !(globalThis as { rateLimitStore?: Map<string, { count: number; resetTime: number }> })
          .rateLimitStore
      ) {
        (
          globalThis as { rateLimitStore?: Map<string, { count: number; resetTime: number }> }
        ).rateLimitStore = memoryStore;
      }

      const memoryEntry = memoryStore.get(memoryKey);
      const now = Date.now();

      if (!memoryEntry || now > memoryEntry.resetTime) {
        // New window
        memoryStore.set(memoryKey, { count: 1, resetTime: now + windowMs });
        return { allowed: true, remaining: degradedMax - 1, resetTime: now + windowMs };
      } else if (memoryEntry.count >= degradedMax) {
        // Rate limit exceeded
        return {
          allowed: false,
          remaining: 0,
          resetTime: memoryEntry.resetTime,
          retryAfter: Math.ceil((memoryEntry.resetTime - now) / 1000),
        };
      } else {
        // Increment count
        memoryEntry.count++;
        return {
          allowed: true,
          remaining: degradedMax - memoryEntry.count,
          resetTime: memoryEntry.resetTime,
        };
      }
    } else {
      // Fail open: Allow request (default behavior)
      logger.warn('[rate-limit] Redis unavailable, allowing request (fail-open mode)');
      return { allowed: true, remaining: max, resetTime: resetTime };
    }
  }
}

/**
 * Wrap a request handler with rate limiting
 *
 * @param handler - Request handler function
 * @param options - Rate limit options
 * @returns Wrapped handler with rate limiting
 *
 * @example
 * ```typescript
 * export default withRateLimit(async (req, res) => {
 *   // Your handler code
 * }, { max: 10, windowMs: 60000 });
 * ```
 */
export function withRateLimit(
  handler: RequestHandler,
  options: RateLimitOptions = {}
): RequestHandler {
  return async (req: Request, res: Response): Promise<unknown> => {
    const result = await checkRateLimit(req, options);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', options.max ?? DEFAULT_MAX);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

    if (!result.allowed) {
      // Rate limit exceeded
      if (result.retryAfter !== undefined) {
        res.setHeader('Retry-After', result.retryAfter);
      }
      return res.status(429).json({
        error: { message: options.message ?? 'Too many requests, please try again later.' },
      });
    }

    // Request allowed, proceed with handler
    return handler(req, res);
  };
}

/**
 * Pre-configured rate limit options for login
 * Uses fail-closed mode for security (critical endpoint)
 */
export const loginRateLimitOptions: RateLimitOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts
  message: 'Too many login attempts, please try again later.',
  failureMode: RateLimitFailureMode.FAIL_CLOSED, // Critical: reject if Redis fails
  degradedMax: 2, // Stricter limit in degraded mode (if implemented)
} as const;

/**
 * Pre-configured rate limit options for email
 */
export const emailRateLimitOptions: RateLimitOptions = {
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 email requests
  message: 'Too many email requests, please try again later.',
} as const;

/**
 * Pre-configured rate limit options for general API
 */
export const apiRateLimitOptions: RateLimitOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests
  message: 'Too many requests, please try again later.',
} as const;

/**
 * Pre-configured rate limit options for voting
 */
export const voteRateLimitOptions: RateLimitOptions = {
  windowMs: 30 * 24 * 60 * 60 * 1000, // 30 days
  max: 1, // 1 vote per 30 days
  message: 'You have already voted. Please wait before voting again.',
} as const;
