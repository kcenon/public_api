import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RedisCacheAdapter } from '../../src/core/redis-cache-adapter.js';
import type { RedisLikeClient } from '../../src/core/redis-cache-adapter.js';

function createMockRedis(): RedisLikeClient {
  return {
    get: vi.fn().mockResolvedValue(null),
    setex: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
    exists: vi.fn().mockResolvedValue(0),
    scan: vi.fn().mockResolvedValue(['0', []]),
    quit: vi.fn().mockResolvedValue('OK'),
  };
}

describe('RedisCacheAdapter', () => {
  let redis: RedisLikeClient;
  let adapter: RedisCacheAdapter;

  beforeEach(() => {
    redis = createMockRedis();
    adapter = new RedisCacheAdapter(redis);
  });

  describe('get', () => {
    it('should return parsed JSON value', async () => {
      vi.mocked(redis.get).mockResolvedValue(
        JSON.stringify({ foo: 'bar', count: 42 }),
      );

      const result = await adapter.get<{ foo: string; count: number }>(
        'test-key',
      );

      expect(result).toEqual({ foo: 'bar', count: 42 });
      expect(redis.get).toHaveBeenCalledWith('pdsdk:test-key');
    });

    it('should return undefined for missing key', async () => {
      vi.mocked(redis.get).mockResolvedValue(null);

      const result = await adapter.get('missing-key');

      expect(result).toBeUndefined();
    });

    it('should return undefined on Redis error', async () => {
      vi.mocked(redis.get).mockRejectedValue(new Error('Connection refused'));

      const result = await adapter.get('test-key');

      expect(result).toBeUndefined();
    });

    it('should return undefined on invalid JSON', async () => {
      vi.mocked(redis.get).mockResolvedValue('not-valid-json');

      const result = await adapter.get('test-key');

      expect(result).toBeUndefined();
    });
  });

  describe('set', () => {
    it('should serialize value and set with TTL', async () => {
      const value = { data: [1, 2, 3], nested: { a: true } };

      await adapter.set('test-key', value, 3600);

      expect(redis.setex).toHaveBeenCalledWith(
        'pdsdk:test-key',
        3600,
        JSON.stringify(value),
      );
    });

    it('should not throw on Redis error', async () => {
      vi.mocked(redis.setex).mockRejectedValue(new Error('Connection refused'));

      await expect(
        adapter.set('test-key', { data: 'value' }, 60),
      ).resolves.toBeUndefined();
    });
  });

  describe('delete', () => {
    it('should delete key and return true', async () => {
      vi.mocked(redis.del).mockResolvedValue(1);

      const result = await adapter.delete('test-key');

      expect(result).toBe(true);
      expect(redis.del).toHaveBeenCalledWith('pdsdk:test-key');
    });

    it('should return false when key does not exist', async () => {
      vi.mocked(redis.del).mockResolvedValue(0);

      const result = await adapter.delete('missing-key');

      expect(result).toBe(false);
    });

    it('should return false on Redis error', async () => {
      vi.mocked(redis.del).mockRejectedValue(new Error('Connection refused'));

      const result = await adapter.delete('test-key');

      expect(result).toBe(false);
    });
  });

  describe('has', () => {
    it('should return true when key exists', async () => {
      vi.mocked(redis.exists).mockResolvedValue(1);

      const result = await adapter.has('test-key');

      expect(result).toBe(true);
      expect(redis.exists).toHaveBeenCalledWith('pdsdk:test-key');
    });

    it('should return false when key does not exist', async () => {
      vi.mocked(redis.exists).mockResolvedValue(0);

      const result = await adapter.has('missing-key');

      expect(result).toBe(false);
    });

    it('should return false on Redis error', async () => {
      vi.mocked(redis.exists).mockRejectedValue(
        new Error('Connection refused'),
      );

      const result = await adapter.has('test-key');

      expect(result).toBe(false);
    });
  });

  describe('clear', () => {
    it('should scan and delete all prefixed keys', async () => {
      vi.mocked(redis.scan)
        .mockResolvedValueOnce(['1', ['pdsdk:key1', 'pdsdk:key2']])
        .mockResolvedValueOnce(['0', ['pdsdk:key3']]);

      await adapter.clear();

      expect(redis.scan).toHaveBeenCalledTimes(2);
      expect(redis.del).toHaveBeenCalledWith('pdsdk:key1', 'pdsdk:key2');
      expect(redis.del).toHaveBeenCalledWith('pdsdk:key3');
    });

    it('should handle empty scan result', async () => {
      vi.mocked(redis.scan).mockResolvedValue(['0', []]);

      await adapter.clear();

      expect(redis.del).not.toHaveBeenCalled();
    });

    it('should not throw on Redis error', async () => {
      vi.mocked(redis.scan).mockRejectedValue(new Error('Connection refused'));

      await expect(adapter.clear()).resolves.toBeUndefined();
    });
  });

  describe('size', () => {
    it('should count all prefixed keys', async () => {
      vi.mocked(redis.scan)
        .mockResolvedValueOnce(['1', ['pdsdk:key1', 'pdsdk:key2']])
        .mockResolvedValueOnce(['0', ['pdsdk:key3']]);

      const result = await adapter.size();

      expect(result).toBe(3);
    });

    it('should return 0 on Redis error', async () => {
      vi.mocked(redis.scan).mockRejectedValue(new Error('Connection refused'));

      const result = await adapter.size();

      expect(result).toBe(0);
    });
  });

  describe('key prefix', () => {
    it('should use default prefix "pdsdk:"', async () => {
      await adapter.get('mykey');

      expect(redis.get).toHaveBeenCalledWith('pdsdk:mykey');
    });

    it('should use custom prefix', async () => {
      const customAdapter = new RedisCacheAdapter(redis, 'custom:');

      await customAdapter.get('mykey');

      expect(redis.get).toHaveBeenCalledWith('custom:mykey');
    });
  });

  describe('disconnect', () => {
    it('should call quit on Redis client', async () => {
      await adapter.disconnect();

      expect(redis.quit).toHaveBeenCalled();
    });
  });

  describe('JSON round-trip', () => {
    it('should correctly serialize and deserialize complex objects', async () => {
      const complexValue = {
        data: [
          { id: 1, name: 'test', nested: { arr: [1, 2] } },
          { id: 2, name: 'test2', nested: { arr: [3, 4] } },
        ],
        meta: { cached: true, timestamp: '2024-01-01T00:00:00Z' },
      };

      vi.mocked(redis.get).mockResolvedValue(JSON.stringify(complexValue));

      const result = await adapter.get('complex-key');

      expect(result).toEqual(complexValue);
    });
  });
});
