/**
 * Redis Client Tests
 * Tests for api/redis-client.ts
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock redis module
vi.mock('redis', () => {
  const mockClient = {
    isOpen: false,
    connect: vi.fn(),
    on: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
    setex: vi.fn(),
    incr: vi.fn(),
    pttl: vi.fn(),
    pexpire: vi.fn(),
    lRange: vi.fn(),
    lPush: vi.fn(),
    pipeline: vi.fn(() => ({
      incr: vi.fn().mockReturnThis(),
      pttl: vi.fn().mockReturnThis(),
      exec: vi.fn(),
    })),
  };

  return {
    createClient: vi.fn(() => mockClient),
    RedisClientType: {},
  };
});

describe('Redis Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof process !== 'undefined' && process.env) {
      delete (process.env as any).REDIS_URL;
    }
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should throw error if REDIS_URL is not configured', async () => {
    if (typeof process !== 'undefined' && process.env) {
      delete (process.env as any).REDIS_URL;
    }

    const { getRedisClient } = await import('@api/redis-client.js');

    await expect(getRedisClient()).rejects.toThrow('REDIS_URL is not configured');
  });

  it('should create client with REDIS_URL', async () => {
    if (typeof process !== 'undefined' && process.env) {
      (process.env as any).REDIS_URL = 'redis://localhost:6379';
    }

    const { createClient } = await import('redis');
    const { getRedisClient } = await import('@api/redis-client.js');

    const client = await getRedisClient();

    expect(createClient).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'redis://localhost:6379',
      })
    );
    expect(client).toBeDefined();
  });

  it('should return existing client if already connected', async () => {
    if (typeof process !== 'undefined' && process.env) {
      (process.env as any).REDIS_URL = 'redis://localhost:6379';
    }

    const { getRedisClient } = await import('@api/redis-client.js');
    const { createClient } = await import('redis');

    const client1 = await getRedisClient();
    (client1 as { isOpen: boolean }).isOpen = true;

    const client2 = await getRedisClient();

    expect(client1).toBe(client2);
    expect(createClient).toHaveBeenCalledTimes(1);
  });

  it('should handle connection errors', async () => {
    if (typeof process !== 'undefined' && process.env) {
      (process.env as any).REDIS_URL = 'redis://invalid:6379';
    }

    const { createClient } = await import('redis');
    const redisUrl =
      typeof process !== 'undefined' && process.env
        ? (process.env as any).REDIS_URL
        : 'redis://invalid:6379';
    const mockClient = createClient({ url: redisUrl });

    (mockClient.connect as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Connection failed')
    );

    const { getRedisClient } = await import('@api/redis-client.js');

    await expect(getRedisClient()).rejects.toThrow();
  });

  it('should set up event handlers', async () => {
    if (typeof process !== 'undefined' && process.env) {
      (process.env as any).REDIS_URL = 'redis://localhost:6379';
    }

    const { createClient } = await import('redis');
    const redisUrl =
      typeof process !== 'undefined' && process.env
        ? (process.env as any).REDIS_URL
        : 'redis://localhost:6379';
    const mockClient = createClient({ url: redisUrl });

    (mockClient.connect as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const { getRedisClient } = await import('@api/redis-client.js');
    await getRedisClient();

    expect(mockClient.on).toHaveBeenCalledWith('error', expect.any(Function));
    expect(mockClient.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockClient.on).toHaveBeenCalledWith('ready', expect.any(Function));
  });
});
