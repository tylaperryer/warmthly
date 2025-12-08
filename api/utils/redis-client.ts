/**
 * Redis Client Utility
 * Provides singleton Redis client with connection management
 * Handles reconnection, timeouts, and error recovery
 */

import { createClient, RedisClientType } from 'redis';

import logger from './logger.js';

/**
 * Maximum reconnection retries
 */
const MAX_RECONNECT_RETRIES = 3;

/**
 * Maximum reconnection delay in milliseconds
 */
const MAX_RECONNECT_DELAY = 3000;

/**
 * Connection timeout in milliseconds
 */
const CONNECTION_TIMEOUT = 5000;

/**
 * Redis client instance
 * Phase 3 Issue 3.11: Improved connection management
 */
let redisClient: RedisClientType | null = null;

/**
 * Connection promise (prevents multiple simultaneous connections)
 */
let connectionPromise: Promise<RedisClientType> | null = null;

/**
 * Connection health check interval (5 minutes)
 */
const HEALTH_CHECK_INTERVAL = 5 * 60 * 1000;

/**
 * Health check timer
 */
let healthCheckTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Get or create Redis client
 * Returns existing client if connected, otherwise creates new connection
 *
 * @returns Promise resolving to Redis client
 * @throws Error if REDIS_URL is not configured or connection fails
 *
 * @example
 * ```typescript
 * const client = await getRedisClient();
 * await client.set('key', 'value');
 * ```
 */
export async function getRedisClient(): Promise<RedisClientType> {
  // Return existing client if connected
  if (redisClient?.isOpen) {
    return redisClient;
  }

  // Return existing connection promise if connecting
  if (connectionPromise) {
    return connectionPromise;
  }

  // Validate configuration
  if (!process.env.REDIS_URL) {
    logger.error('[redis-client] REDIS_URL is not configured');
    throw new Error('REDIS_URL is not configured');
  }

  // Create new connection
  connectionPromise = (async (): Promise<RedisClientType> => {
    try {
      // Create Redis client
      redisClient = createClient({
        url: process.env.REDIS_URL,
        socket: {
          connectTimeout: CONNECTION_TIMEOUT,
          reconnectStrategy: (retries: number): number | Error => {
            if (retries > MAX_RECONNECT_RETRIES) {
              logger.error('[redis-client] Redis reconnection failed after 3 attempts');
              connectionPromise = null;
              return new Error('Redis reconnection failed');
            }
            // Exponential backoff with max delay
            return Math.min(retries * 100, MAX_RECONNECT_DELAY);
          },
        },
      }) as RedisClientType;

      // Error handler
      redisClient.on('error', (err: Error) => {
        logger.error('[redis-client] Redis Client Error:', err);
        if (!redisClient?.isOpen) {
          connectionPromise = null;
        }
      });

      // Connection event handlers
      redisClient.on('connect', () => {
        logger.log('[redis-client] Redis connected');
      });

      redisClient.on('ready', () => {
        logger.log('[redis-client] Redis ready');
        // Start health check when ready
        startHealthCheck();
      });

      redisClient.on('reconnecting', () => {
        logger.warn('[redis-client] Redis reconnecting...');
      });

      redisClient.on('end', () => {
        logger.warn('[redis-client] Redis connection ended');
        stopHealthCheck();
        connectionPromise = null;
        redisClient = null;
      });

      // Connect with timeout
      if (!redisClient.isOpen) {
        await Promise.race([
          redisClient.connect(),
          new Promise<never>((_, reject) =>
            setTimeout(() => {
              reject(new Error('Connection timeout'));
            }, CONNECTION_TIMEOUT)
          ),
        ]);
      }

      // Clear connection promise on success
      connectionPromise = null;
      return redisClient;
    } catch (connectError: unknown) {
      // Cleanup on error
      connectionPromise = null;
      redisClient = null;

      // Log error details
      if (connectError instanceof Error) {
        logger.error('[redis-client] Redis connection failed:', {
          message: connectError.message,
          stack: connectError.stack,
          name: connectError.name,
        });
        throw connectError;
      }

      // Unknown error type
      const error = new Error('Redis connection failed');
      logger.error('[redis-client] Redis connection failed:', error);
      throw error;
    }
  })();

  return connectionPromise;
}

/**
 * Start health check for Redis connection
 * Phase 3 Issue 3.11: Improved connection management
 */
function startHealthCheck(): void {
  if (healthCheckTimer) {
    return; // Already running
  }

  healthCheckTimer = setInterval(async () => {
    if (!redisClient) {
      stopHealthCheck();
      return;
    }

    try {
      // Simple ping to check connection health
      if (redisClient.isOpen) {
        await redisClient.ping();
        logger.log('[redis-client] Health check: OK');
      } else {
        logger.warn('[redis-client] Health check: Connection not open');
        // Reset connection
        connectionPromise = null;
        redisClient = null;
        stopHealthCheck();
      }
    } catch (error) {
      logger.error('[redis-client] Health check failed:', error);
      // Reset connection on health check failure
      connectionPromise = null;
      redisClient = null;
      stopHealthCheck();
    }
  }, HEALTH_CHECK_INTERVAL);
}

/**
 * Stop health check
 */
function stopHealthCheck(): void {
  if (healthCheckTimer) {
    clearInterval(healthCheckTimer);
    healthCheckTimer = null;
  }
}

/**
 * Close Redis connection gracefully
 * Phase 3 Issue 3.11: Improved connection management
 *
 * @returns Promise that resolves when connection is closed
 */
export async function closeRedisClient(): Promise<void> {
  stopHealthCheck();

  if (redisClient && redisClient.isOpen) {
    try {
      await redisClient.quit();
      logger.log('[redis-client] Redis connection closed gracefully');
    } catch (error) {
      logger.error('[redis-client] Error closing Redis connection:', error);
      // Force disconnect if quit fails
      try {
        await redisClient.disconnect();
      } catch (disconnectError) {
        logger.error('[redis-client] Error disconnecting Redis:', disconnectError);
      }
    }
  }

  connectionPromise = null;
  redisClient = null;
}
