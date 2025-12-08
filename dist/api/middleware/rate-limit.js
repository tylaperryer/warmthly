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
export var RateLimitFailureMode;
(function (RateLimitFailureMode) {
    /** Fail open: Allow requests if Redis fails (default for non-critical endpoints) */
    RateLimitFailureMode["FAIL_OPEN"] = "fail_open";
    /** Fail closed: Reject requests if Redis fails (for critical endpoints) */
    RateLimitFailureMode["FAIL_CLOSED"] = "fail_closed";
    /** Degraded: Use in-memory fallback with stricter limits if Redis fails */
    RateLimitFailureMode["DEGRADED"] = "degraded";
})(RateLimitFailureMode || (RateLimitFailureMode = {}));
/**
 * Get client identifier from request
 * Uses IP address from headers or connection
 *
 * @param req - Request object
 * @returns Client identifier string
 */
function getClientIdentifier(req) {
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
async function checkRateLimit(req, options = {}) {
    const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
    const max = options.max ?? DEFAULT_MAX;
    const identifier = getClientIdentifier(req);
    const key = `ratelimit:${identifier}:${req.url}`;
    const now = Date.now();
    const resetTime = now + windowMs;
    try {
        const client = await getRedisClient();
        // Use pipeline for atomic operations
        const pipeline = client.pipeline();
        pipeline.incr(key);
        pipeline.pttl(key);
        const results = await pipeline.exec();
        if (!results || results.length < 2) {
            throw new Error('Redis pipeline execution failed');
        }
        const count = results[0]?.[1];
        const ttl = results[1]?.[1];
        if (typeof count !== 'number' || typeof ttl !== 'number') {
            throw new Error('Invalid Redis response');
        }
        // Set expiration if this is the first request or key has no TTL
        if (count === 1) {
            await client.pexpire(key, windowMs);
        }
        else if (ttl === -1) {
            await client.pexpire(key, windowMs);
        }
        // Get actual TTL
        const actualTtl = await client.pttl(key);
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
    }
    catch (error) {
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
        }
        else if (failureMode === RateLimitFailureMode.DEGRADED) {
            // Degraded mode: Use in-memory fallback with stricter limits
            const degradedMax = options.degradedMax ?? Math.max(1, Math.floor(max / 10)); // 10% of normal limit
            logger.warn(`[rate-limit] Redis unavailable, using degraded mode (limit: ${degradedMax})`);
            // Simple in-memory rate limiting (per-process, not distributed)
            // In production, consider using a shared in-memory store or stricter limits
            const memoryKey = `memory:ratelimit:${identifier}:${req.url}`;
            const memoryStore = globalThis
                .rateLimitStore ?? new Map();
            if (!globalThis
                .rateLimitStore) {
                globalThis.rateLimitStore = memoryStore;
            }
            const memoryEntry = memoryStore.get(memoryKey);
            const now = Date.now();
            if (!memoryEntry || now > memoryEntry.resetTime) {
                // New window
                memoryStore.set(memoryKey, { count: 1, resetTime: now + windowMs });
                return { allowed: true, remaining: degradedMax - 1, resetTime: now + windowMs };
            }
            else if (memoryEntry.count >= degradedMax) {
                // Rate limit exceeded
                return {
                    allowed: false,
                    remaining: 0,
                    resetTime: memoryEntry.resetTime,
                    retryAfter: Math.ceil((memoryEntry.resetTime - now) / 1000),
                };
            }
            else {
                // Increment count
                memoryEntry.count++;
                return {
                    allowed: true,
                    remaining: degradedMax - memoryEntry.count,
                    resetTime: memoryEntry.resetTime,
                };
            }
        }
        else {
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
export function withRateLimit(handler, options = {}) {
    return async (req, res) => {
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
export const loginRateLimitOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 login attempts
    message: 'Too many login attempts, please try again later.',
    failureMode: RateLimitFailureMode.FAIL_CLOSED, // Critical: reject if Redis fails
    degradedMax: 2, // Stricter limit in degraded mode (if implemented)
};
/**
 * Pre-configured rate limit options for email
 */
export const emailRateLimitOptions = {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 email requests
    message: 'Too many email requests, please try again later.',
};
/**
 * Pre-configured rate limit options for general API
 */
export const apiRateLimitOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests
    message: 'Too many requests, please try again later.',
};
/**
 * Pre-configured rate limit options for voting
 */
export const voteRateLimitOptions = {
    windowMs: 30 * 24 * 60 * 60 * 1000, // 30 days
    max: 1, // 1 vote per 30 days
    message: 'You have already voted. Please wait before voting again.',
};
//# sourceMappingURL=rate-limit.js.map