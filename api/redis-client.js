// Shared Redis client utility for serverless functions
// Reuses connections across invocations for better performance

import { createClient } from 'redis';
import logger from './logger.js';

// Create a reusable Redis client (will be reused across invocations in serverless)
let redisClient = null;

export async function getRedisClient() {
  // Check if we have an existing open connection
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  // Validate REDIS_URL is configured
  if (!process.env.REDIS_URL) {
    logger.error('[redis-client] REDIS_URL is not configured');
    throw new Error('REDIS_URL is not configured');
  }

  // Create new client
  redisClient = createClient({
    url: process.env.REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 3) {
          logger.error('[redis-client] Redis reconnection failed after 3 attempts');
          return new Error('Redis reconnection failed');
        }
        return Math.min(retries * 100, 3000);
      }
    }
  });

  // Error handling
  redisClient.on('error', (err) => {
    logger.error('[redis-client] Redis Client Error:', err);
  });

  // Connect if not already connected
  if (!redisClient.isOpen) {
    try {
      await redisClient.connect();
    } catch (connectError) {
      logger.error('[redis-client] Redis connection failed:', {
        message: connectError.message,
        stack: connectError.stack,
        name: connectError.name
      });
      redisClient = null;
      throw connectError;
    }
  }

  return redisClient;
}

