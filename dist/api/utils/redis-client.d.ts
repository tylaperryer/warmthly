/**
 * Redis Client Utility
 * Provides singleton Redis client with connection management
 * Handles reconnection, timeouts, and error recovery
 */
import { RedisClientType } from 'redis';
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
export declare function getRedisClient(): Promise<RedisClientType>;
//# sourceMappingURL=redis-client.d.ts.map