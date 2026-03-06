import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  MemoryCacheAdapter,
  CacheManager,
} from '../../src/core/cache.js';

describe('MemoryCacheAdapter', () => {
  let adapter: MemoryCacheAdapter;

  beforeEach(() => {
    adapter = new MemoryCacheAdapter(5);
  });

  it('should set and get a value', async () => {
    await adapter.set('key1', { data: 'hello' }, 60);
    const result = await adapter.get<{ data: string }>('key1');
    expect(result).toEqual({ data: 'hello' });
  });

  it('should return undefined for missing key', async () => {
    const result = await adapter.get('nonexistent');
    expect(result).toBeUndefined();
  });

  it('should expire entries after TTL', async () => {
    vi.useFakeTimers();
    try {
      await adapter.set('key1', 'value1', 1);
      expect(await adapter.get('key1')).toBe('value1');

      vi.advanceTimersByTime(1001);
      expect(await adapter.get('key1')).toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it('should delete an entry', async () => {
    await adapter.set('key1', 'value1', 60);
    const deleted = await adapter.delete('key1');
    expect(deleted).toBe(true);
    expect(await adapter.get('key1')).toBeUndefined();
  });

  it('should return false when deleting nonexistent key', async () => {
    const deleted = await adapter.delete('nonexistent');
    expect(deleted).toBe(false);
  });

  it('should clear all entries', async () => {
    await adapter.set('key1', 'a', 60);
    await adapter.set('key2', 'b', 60);
    await adapter.clear();
    expect(await adapter.size()).toBe(0);
  });

  it('should check if key exists', async () => {
    await adapter.set('key1', 'value1', 60);
    expect(await adapter.has('key1')).toBe(true);
    expect(await adapter.has('nonexistent')).toBe(false);
  });

  it('should not report expired key as existing', async () => {
    vi.useFakeTimers();
    try {
      await adapter.set('key1', 'value1', 1);
      vi.advanceTimersByTime(1001);
      expect(await adapter.has('key1')).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('should evict oldest entries when at max capacity', async () => {
    const adapter5 = new MemoryCacheAdapter(3);
    await adapter5.set('a', 1, 60);
    await adapter5.set('b', 2, 60);
    await adapter5.set('c', 3, 60);
    // At capacity — next set should evict 'a'
    await adapter5.set('d', 4, 60);

    expect(await adapter5.get('a')).toBeUndefined();
    expect(await adapter5.get('b')).toBe(2);
    expect(await adapter5.get('d')).toBe(4);
  });

  it('should move accessed entries to end (LRU)', async () => {
    const adapter3 = new MemoryCacheAdapter(3);
    await adapter3.set('a', 1, 60);
    await adapter3.set('b', 2, 60);
    await adapter3.set('c', 3, 60);

    // Access 'a' — moves it to end
    await adapter3.get('a');

    // Insert 'd' — should evict 'b' (oldest untouched)
    await adapter3.set('d', 4, 60);

    expect(await adapter3.get('a')).toBe(1);
    expect(await adapter3.get('b')).toBeUndefined();
    expect(await adapter3.get('c')).toBe(3);
    expect(await adapter3.get('d')).toBe(4);
  });

  it('should report correct size', async () => {
    expect(await adapter.size()).toBe(0);
    await adapter.set('a', 1, 60);
    await adapter.set('b', 2, 60);
    expect(await adapter.size()).toBe(2);
  });
});

describe('CacheManager', () => {
  let manager: CacheManager;

  beforeEach(() => {
    manager = new CacheManager({ defaultTtl: 60, maxEntries: 100 });
  });

  it('should set and get a value', async () => {
    await manager.set('key1', { name: 'test' });
    const result = await manager.get<{ name: string }>('key1');
    expect(result).toEqual({ name: 'test' });
  });

  it('should track cache hits', async () => {
    await manager.set('key1', 'value1');
    await manager.get('key1');

    const stats = await manager.getStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(0);
    expect(stats.hitRate).toBe(1);
  });

  it('should track cache misses', async () => {
    await manager.get('nonexistent');

    const stats = await manager.getStats();
    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBe(0);
  });

  it('should calculate hit rate correctly', async () => {
    await manager.set('key1', 'value1');
    await manager.get('key1'); // hit
    await manager.get('key1'); // hit
    await manager.get('miss'); // miss

    const stats = await manager.getStats();
    expect(stats.hits).toBe(2);
    expect(stats.misses).toBe(1);
    expect(stats.hitRate).toBeCloseTo(2 / 3);
  });

  it('should reset stats on clear', async () => {
    await manager.set('key1', 'value1');
    await manager.get('key1');
    await manager.clear();

    const stats = await manager.getStats();
    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(0);
    expect(stats.size).toBe(0);
  });

  it('should return undefined when disabled', async () => {
    const disabled = new CacheManager({ enabled: false });
    await disabled.set('key1', 'value1');
    const result = await disabled.get('key1');
    expect(result).toBeUndefined();
  });

  it('should use custom TTL', async () => {
    vi.useFakeTimers();
    try {
      await manager.set('key1', 'value1', 1);
      vi.advanceTimersByTime(1001);
      const result = await manager.get('key1');
      expect(result).toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it('should delete by key', async () => {
    await manager.set('key1', 'value1');
    const deleted = await manager.delete('key1');
    expect(deleted).toBe(true);
    expect(await manager.has('key1')).toBe(false);
  });

  it('should check has correctly', async () => {
    expect(await manager.has('key1')).toBe(false);
    await manager.set('key1', 'value1');
    expect(await manager.has('key1')).toBe(true);
  });

  it('should return false for has when disabled', async () => {
    const disabled = new CacheManager({ enabled: false });
    expect(await disabled.has('key1')).toBe(false);
  });
});

describe('CacheManager.generateKey', () => {
  it('should generate deterministic keys', () => {
    const key1 = CacheManager.generateKey('weather', 'getForecast', {
      nx: 60,
      ny: 127,
      baseDate: '20260306',
    });
    const key2 = CacheManager.generateKey('weather', 'getForecast', {
      baseDate: '20260306',
      ny: 127,
      nx: 60,
    });
    expect(key1).toBe(key2);
  });

  it('should produce different keys for different params', () => {
    const key1 = CacheManager.generateKey('weather', 'getForecast', {
      nx: 60,
    });
    const key2 = CacheManager.generateKey('weather', 'getForecast', {
      nx: 61,
    });
    expect(key1).not.toBe(key2);
  });

  it('should include adapter and method in key', () => {
    const key = CacheManager.generateKey('weather', 'getForecast', {});
    expect(key).toContain('weather');
    expect(key).toContain('getForecast');
  });

  it('should skip undefined and null values', () => {
    const key1 = CacheManager.generateKey('a', 'b', { x: 1 });
    const key2 = CacheManager.generateKey('a', 'b', {
      x: 1,
      y: undefined,
      z: null,
    });
    expect(key1).toBe(key2);
  });
});
