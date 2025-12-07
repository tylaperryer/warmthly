/**
 * Enhanced Rate Limiting with Exponential Backoff
 * Provides progressive delays for repeated violations
 * Security Enhancement 6: Enhanced Rate Limiting
 */

import logger from '../utils/logger.js';
import { getRedisClient } from '../utils/redis-client.js';
import { RateLimitOptions, RateLimitResult } from './rate-limit.js';

/**
 * Request object interface
 */
interface Request {
  readonly method: string;
  readonly url: string;
  readonly headers: {
    readonly 'x-forwarded-for'?: string;
    readonly 'x-real-ip'?: string;
    readonly [key: string]: string | undefined;
  };
  readonly connection?: {
    readonly remoteAddress?: string;
  };
  [key: string]: unknown;
}

/**
 * Enhanced rate limit result with backoff
 */
export interface EnhancedRateLimitResult extends RateLimitResult {
  readonly backoffSeconds?: number;
  readonly violationCount?: number;
}

/**
 * Get client identifier from request
 */
function getClientIdentifier(req: Request): string {
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
async function getViolationCount(identifier: string): Promise<number> {
  try {
    const client = await getRedisClient();
    const key = `ratelimit:violations:${identifier}`;
    const count = await client.get(key);
    return count ? parseInt(count, 10) : 0;
  } catch (error: unknown) {
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
async function incrementViolationCount(identifier: string, ttl: number = 3600000): Promise<void> {
  try {
    const client = await getRedisClient();
    const key = `ratelimit:violations:${identifier}`;
    await client.incr(key);
    await client.pexpire(key, ttl);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('[rate-limit-enhanced] Error incrementing violation count:', errorMessage);
  }
}

/**
 * Reset violation count (for good behavior)
 * 
 * @param identifier - Client identifier
 */
async function resetViolationCount(identifier: string): Promise<void> {
  try {
    const client = await getRedisClient();
    const key = `ratelimit:violations:${identifier}`;
    await client.del(key);
  } catch (error: unknown) {
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
function calculateBackoff(
  violations: number,
  baseDelaySeconds: number = 60,
  maxDelaySeconds: number = 3600
): number {
  if (violations === 0) {
    return 0;
  }

  // Exponential backoff: 2^violations * baseDelay
  const backoff = Math.min(
    Math.pow(2, violations) * baseDelaySeconds,
    maxDelaySeconds
  );

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
export async function checkRateLimitWithBackoff(
  req: Request,
  options: RateLimitOptions,
  baseResult: RateLimitResult
): Promise<EnhancedRateLimitResult> {
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
 * Enhanced rate limit options with backoff configuration
 */
export interface EnhancedRateLimitOptions extends RateLimitOptions {
  readonly enableBackoff?: boolean;
  readonly baseBackoffSeconds?: number;
  readonly maxBackoffSeconds?: number;
}

/**
 * Wrap a request handler with enhanced rate limiting (with backoff)
 * 
 * @param handler - Request handler function
 * @param options - Enhanced rate limit options
 * @returns Wrapped handler with enhanced rate limiting
 */
export async function checkEnhancedRateLimit(
  req: Request,
  options: EnhancedRateLimitOptions,
  baseResult: RateLimitResult
): Promise<EnhancedRateLimitResult> {
  if (!options.enableBackoff) {
    return baseResult;
  }

  return checkRateLimitWithBackoff(req, options, baseResult);
}

