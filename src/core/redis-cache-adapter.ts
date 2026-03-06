import type { CacheAdapter } from './cache.js';

/** Configuration for Redis cache adapter. */
export interface RedisCacheConfig {
  /** Redis host (default: 'localhost'). */
  host?: string;
  /** Redis port (default: 6379). */
  port?: number;
  /** Redis password. */
  password?: string;
  /** Redis database number (default: 0). */
  db?: number;
  /** Key prefix for namespace isolation (default: 'pdsdk:'). */
  keyPrefix?: string;
}

/**
 * Redis-backed cache adapter using ioredis.
 *
 * Requires `ioredis` as an optional peer dependency.
 * Provides distributed caching for multi-instance deployments.
 *
 * @example
 * ```typescript
 * import Redis from 'ioredis';
 * import { RedisCacheAdapter } from '@kcenon/public-data-sdk';
 *
 * const adapter = new RedisCacheAdapter(new Redis());
 * const sdk = new PublicDataSDK({
 *   serviceKey: 'KEY',
 *   cache: { adapter }
 * });
 * ```
 */
export class RedisCacheAdapter implements CacheAdapter {
  private readonly client: RedisLikeClient;
  private readonly keyPrefix: string;

  /**
   * Create a Redis cache adapter.
   * @param client An ioredis client instance.
   * @param keyPrefix Key prefix for namespace isolation (default: 'pdsdk:').
   */
  constructor(client: RedisLikeClient, keyPrefix = 'pdsdk:') {
    this.client = client;
    this.keyPrefix = keyPrefix;
  }

  async get<T>(key: string): Promise<T | undefined> {
    try {
      const raw = await this.client.get(this.prefixKey(key));
      if (raw === null || raw === undefined) return undefined;
      return JSON.parse(raw) as T;
    } catch {
      return undefined;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await this.client.setex(this.prefixKey(key), ttlSeconds, serialized);
    } catch {
      // Graceful degradation: cache write failure is non-fatal
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const count = await this.client.del(this.prefixKey(key));
      return count > 0;
    } catch {
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      const pattern = `${this.keyPrefix}*`;
      let cursor = '0';
      do {
        const [nextCursor, keys] = await this.client.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100,
        );
        cursor = nextCursor;
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      } while (cursor !== '0');
    } catch {
      // Graceful degradation
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const exists = await this.client.exists(this.prefixKey(key));
      return exists > 0;
    } catch {
      return false;
    }
  }

  async size(): Promise<number> {
    try {
      const pattern = `${this.keyPrefix}*`;
      let count = 0;
      let cursor = '0';
      do {
        const [nextCursor, keys] = await this.client.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100,
        );
        cursor = nextCursor;
        count += keys.length;
      } while (cursor !== '0');
      return count;
    } catch {
      return 0;
    }
  }

  /** Disconnect the Redis client. */
  async disconnect(): Promise<void> {
    await this.client.quit();
  }

  private prefixKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }
}

/**
 * Minimal interface for ioredis client methods used by RedisCacheAdapter.
 * This allows type-safe usage without importing ioredis directly.
 */
export interface RedisLikeClient {
  get(key: string): Promise<string | null>;
  setex(key: string, seconds: number, value: string): Promise<string>;
  del(...keys: string[]): Promise<number>;
  exists(key: string): Promise<number>;
  scan(
    cursor: string,
    ...args: (string | number)[]
  ): Promise<[cursor: string, keys: string[]]>;
  quit(): Promise<string>;
}
