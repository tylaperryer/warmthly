/**
 * Enhanced Rate Limiting with Exponential Backoff
 * Provides progressive delays for repeated violations
 * Security Enhancement 6: Enhanced Rate Limiting
 */
import logger from '../utils/logger.js';
import { getRedisClient } from '../utils/redis-client.js';
/**
 * Get client identifier from request
 */
function getClientIdentifier(req) {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
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
 * Get violation count for an identifier
 * Tracks how many times this client has exceeded rate limits
 *
 * @param identifier - Client identifier
 * @returns Number of violations
 */
async function getViolationCount(identifier) {
    try {
        const client = await getRedisClient();
        const key = `ratelimit:violations:${identifier}`;
        const count = await client.get(key);
        return count ? parseInt(count, 10) : 0;
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('[rate-limit-enhanced] Error getting violation count:', errorMessage);
        return 0;
    }
}
/**
 * Increment violation count
 *
 * @param identifier - Client identifier
 * @param ttl - Time-to-live in milliseconds (default: 1 hour)
 */
async function incrementViolationCount(identifier, ttl = 3600000) {
    try {
        const client = await getRedisClient();
        const key = `ratelimit:violations:${identifier}`;
        await client.incr(key);
        await client.pexpire(key, ttl);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('[rate-limit-enhanced] Error incrementing violation count:', errorMessage);
    }
}
/**
 * Reset violation count (for good behavior)
 *
 * @param identifier - Client identifier
 */
async function resetViolationCount(identifier) {
    try {
        const client = await getRedisClient();
        const key = `ratelimit:violations:${identifier}`;
        await client.del(key);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('[rate-limit-enhanced] Error resetting violation count:', errorMessage);
    }
}
/**
 * Calculate exponential backoff delay
 * Formula: min(2^violations * baseDelay, maxDelay)
 *
 * @param violations - Number of violations
 * @param baseDelaySeconds - Base delay in seconds (default: 60)
 * @param maxDelaySeconds - Maximum delay in seconds (default: 3600 = 1 hour)
 * @returns Backoff delay in seconds
 */
function calculateBackoff(violations, baseDelaySeconds = 60, maxDelaySeconds = 3600) {
    if (violations === 0) {
        return 0;
    }
    // Exponential backoff: 2^violations * baseDelay
    const backoff = Math.min(Math.pow(2, violations) * baseDelaySeconds, maxDelaySeconds);
    return Math.ceil(backoff);
}
/**
 * Check rate limit with exponential backoff
 *
 * @param req - Request object
 * @param options - Rate limit options
 * @param baseResult - Base rate limit result from standard check
 * @returns Enhanced rate limit result with backoff
 */
export async function checkRateLimitWithBackoff(req, options, baseResult) {
    // If request is allowed, reset violation count (good behavior)
    if (baseResult.allowed) {
        const identifier = getClientIdentifier(req);
        await resetViolationCount(identifier);
        return baseResult;
    }
    // Request was blocked - check violation count and apply backoff
    const identifier = getClientIdentifier(req);
    const violations = await getViolationCount(identifier);
    // Increment violation count
    await incrementViolationCount(identifier);
    // Calculate backoff delay
    const backoffSeconds = calculateBackoff(violations + 1);
    return {
        ...baseResult,
        backoffSeconds,
        violationCount: violations + 1,
        retryAfter: backoffSeconds,
    };
}
/**
 * Wrap a request handler with enhanced rate limiting (with backoff)
 *
 * @param handler - Request handler function
 * @param options - Enhanced rate limit options
 * @returns Wrapped handler with enhanced rate limiting
 */
export async function checkEnhancedRateLimit(req, options, baseResult) {
    if (!options.enableBackoff) {
        return baseResult;
    }
    return checkRateLimitWithBackoff(req, options, baseResult);
}
//# sourceMappingURL=rate-limit-enhanced.js.map