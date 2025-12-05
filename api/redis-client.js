import { createClient } from 'redis';
import logger from './logger.js';

const MAX_RECONNECT_RETRIES = 3;
const MAX_RECONNECT_DELAY = 3000;
const CONNECTION_TIMEOUT = 5000;

let redisClient = null;
let connectionPromise = null;

export async function getRedisClient() {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  if (!process.env.REDIS_URL) {
    logger.error('[redis-client] REDIS_URL is not configured');
    throw new Error('REDIS_URL is not configured');
  }

  connectionPromise = (async () => {
    try {
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
            return Math.min(retries * 100, MAX_RECONNECT_DELAY);
          }
        }
      });

      redisClient.on('error', (err) => {
        logger.error('[redis-client] Redis Client Error:', err);
        if (!redisClient.isOpen) {
          connectionPromise = null;
        }
      });

      redisClient.on('connect', () => {
        logger.log('[redis-client] Redis connected');
      });

      redisClient.on('ready', () => {
        logger.log('[redis-client] Redis ready');
      });

      if (!redisClient.isOpen) {
        await Promise.race([
          redisClient.connect(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection timeout')), CONNECTION_TIMEOUT)
          )
        ]);
      }

      connectionPromise = null;
      return redisClient;
    } catch (connectError) {
      connectionPromise = null;
      redisClient = null;
      logger.error('[redis-client] Redis connection failed:', {
        message: connectError.message,
        stack: connectError.stack,
        name: connectError.name
      });
      throw connectError;
    }
  })();

  return connectionPromise;
}

