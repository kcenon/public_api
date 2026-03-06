import { describe, it, expect, beforeEach } from 'vitest';
import { WeatherAdapter } from '../../src/adapters/weather/index.js';
import { createTestContext } from '../helpers/mock-http-client.js';
import { fixtureToHttpResponse } from '../helpers/fixture-loader.js';

describe('Cache flow integration', () => {
  let adapter: WeatherAdapter;
  let context: ReturnType<typeof createTestContext>;

  beforeEach(() => {
    context = createTestContext();
    adapter = new WeatherAdapter(context);
  });

  it('caches response on first call and returns cached on second', async () => {
    const httpResponse = fixtureToHttpResponse(
      'weather/forecast-success.json',
    );
    context.httpClient.request.mockResolvedValue(httpResponse);

    // First call — cache miss
    const result1 = await adapter.getVilageFcst({
      baseDate: '20240115',
      baseTime: '0500',
      nx: 60,
      ny: 127,
    });
    expect(result1.success).toBe(true);
    expect(result1.meta.cached).toBe(false);
    expect(context.httpClient.request).toHaveBeenCalledTimes(1);

    // Second call — cache hit
    const result2 = await adapter.getVilageFcst({
      baseDate: '20240115',
      baseTime: '0500',
      nx: 60,
      ny: 127,
    });
    expect(result2.success).toBe(true);
    expect(result2.meta.cached).toBe(true);
    expect(context.httpClient.request).toHaveBeenCalledTimes(1); // Not called again
  });

  it('does not cache when caching is disabled', async () => {
    const noCacheContext = createTestContext({
      cache: { enabled: false, ttl: 0, maxEntries: 0 },
    });
    const noCacheAdapter = new WeatherAdapter(noCacheContext);

    const httpResponse = fixtureToHttpResponse(
      'weather/forecast-success.json',
    );
    noCacheContext.httpClient.request.mockResolvedValue(httpResponse);

    await noCacheAdapter.getVilageFcst({
      baseDate: '20240115',
      baseTime: '0500',
      nx: 60,
      ny: 127,
    });
    await noCacheAdapter.getVilageFcst({
      baseDate: '20240115',
      baseTime: '0500',
      nx: 60,
      ny: 127,
    });

    // HTTP client should be called twice since caching is disabled
    expect(noCacheContext.httpClient.request).toHaveBeenCalledTimes(2);
  });

  it('uses different cache keys for different parameters', async () => {
    const httpResponse = fixtureToHttpResponse(
      'weather/forecast-success.json',
    );
    context.httpClient.request.mockResolvedValue(httpResponse);

    await adapter.getVilageFcst({
      baseDate: '20240115',
      baseTime: '0500',
      nx: 60,
      ny: 127,
    });
    await adapter.getVilageFcst({
      baseDate: '20240116',
      baseTime: '0500',
      nx: 60,
      ny: 127,
    });

    // Different params = different cache keys = 2 HTTP calls
    expect(context.httpClient.request).toHaveBeenCalledTimes(2);
  });

  it('tracks cache statistics correctly', async () => {
    const httpResponse = fixtureToHttpResponse(
      'weather/forecast-success.json',
    );
    context.httpClient.request.mockResolvedValue(httpResponse);

    const params = { baseDate: '20240115', baseTime: '0500', nx: 60, ny: 127 };

    // Miss
    await adapter.getVilageFcst(params);
    // Hit
    await adapter.getVilageFcst(params);
    // Hit
    await adapter.getVilageFcst(params);

    const stats = await context.cache.getStats();
    expect(stats.misses).toBe(1);
    expect(stats.hits).toBe(2);
    expect(stats.hitRate).toBeCloseTo(2 / 3);
    expect(stats.size).toBe(1);
  });
});
