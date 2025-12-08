/**
 * Redis Client Utility
 * Provides singleton Redis client with connection management
 * Handles reconnection, timeouts, and error recovery
 */
import { createClient } from 'redis';
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
 */
let redisClient = null;
/**
 * Connection promise (prevents multiple simultaneous connections)
 */
let connectionPromise = null;
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
export async function getRedisClient() {
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
    connectionPromise = (async () => {
        try {
            // Create Redis client
            redisClient = createClient({
                url: process.env.REDIS_URL,
                socket: {
                    connectTimeout: CONNECTION_TIMEOUT,
                    reconnectStrategy: (retries) => {
                        if (retries > MAX_RECONNECT_RETRIES) {
                            logger.error('[redis-client] Redis reconnection failed after 3 attempts');
                            connectionPromise = null;
                            return new Error('Redis reconnection failed');
                        }
                        // Exponential backoff with max delay
                        return Math.min(retries * 100, MAX_RECONNECT_DELAY);
                    },
                },
            });
            // Error handler
            redisClient.on('error', (err) => {
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
            });
            // Connect with timeout
            if (!redisClient.isOpen) {
                await Promise.race([
                    redisClient.connect(),
                    new Promise((_, reject) => setTimeout(() => {
                        reject(new Error('Connection timeout'));
                    }, CONNECTION_TIMEOUT)),
                ]);
            }
            // Clear connection promise on success
            connectionPromise = null;
            return redisClient;
        }
        catch (connectError) {
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
//# sourceMappingURL=redis-client.js.map