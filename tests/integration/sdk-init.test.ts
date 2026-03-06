import { describe, it, expect, beforeEach } from 'vitest';
import { PublicDataSDK } from '../../src/sdk.js';
import { WeatherAdapter } from '../../src/adapters/weather/index.js';
import { BusinessAdapter } from '../../src/adapters/business/index.js';
import { AddressAdapter } from '../../src/adapters/address/index.js';
import { HolidayAdapter } from '../../src/adapters/holiday/index.js';
import { TransportAdapter } from '../../src/adapters/transport/index.js';
import { AirQualityAdapter } from '../../src/adapters/air-quality/index.js';
import { RealEstateAdapter } from '../../src/adapters/real-estate/index.js';

describe('SDK initialization integration', () => {
  let sdk: PublicDataSDK;

  beforeEach(() => {
    sdk = new PublicDataSDK({ serviceKey: 'test-key-for-init' });
  });

  it('initializes with default configuration', () => {
    const config = sdk.getConfig();
    expect(config.timeout).toBe(30000);
    expect(config.cache.enabled).toBe(true);
    expect(config.cache.ttl).toBe(3600);
    expect(config.retry.maxAttempts).toBe(3);
  });

  it('masks service key in getConfig()', () => {
    const longKeySDK = new PublicDataSDK({
      serviceKey: 'abcdefghijklmnop',
    });
    const config = longKeySDK.getConfig();
    expect(config.serviceKey).toBe('abcd****mnop');
    expect(config.serviceKey).not.toContain('efghijkl');
  });

  it('lazily initializes adapters on first access', () => {
    // Accessing weather should create the adapter
    const weather1 = sdk.weather;
    expect(weather1).toBeInstanceOf(WeatherAdapter);

    // Second access returns the same instance
    const weather2 = sdk.weather;
    expect(weather2).toBe(weather1);
  });

  it('provides all 7 adapter types', () => {
    expect(sdk.weather).toBeInstanceOf(WeatherAdapter);
    expect(sdk.business).toBeInstanceOf(BusinessAdapter);
    expect(sdk.address).toBeInstanceOf(AddressAdapter);
    expect(sdk.holiday).toBeInstanceOf(HolidayAdapter);
    expect(sdk.transport).toBeInstanceOf(TransportAdapter);
    expect(sdk.airQuality).toBeInstanceOf(AirQualityAdapter);
    expect(sdk.realEstate).toBeInstanceOf(RealEstateAdapter);
  });

  it('shares adapter context across all adapters', () => {
    const context = sdk.getAdapterContext();
    expect(context.httpClient).toBeDefined();
    expect(context.cache).toBeDefined();
    expect(context.parser).toBeDefined();
    expect(context.config).toBeDefined();
  });

  it('provides cache manager for statistics', async () => {
    const cacheManager = sdk.getCacheManager();
    const stats = await cacheManager.getStats();
    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(0);
    expect(stats.size).toBe(0);
  });

  it('applies custom configuration', () => {
    const customSDK = new PublicDataSDK({
      serviceKey: 'custom-key-12345',
      timeout: 10000,
      cache: { enabled: false, ttl: 600, maxEntries: 50 },
      retry: { maxAttempts: 5, baseDelay: 500, maxDelay: 10000 },
      circuitBreaker: { failureThreshold: 10, resetTimeout: 60000 },
    });
    const config = customSDK.getConfig();
    expect(config.timeout).toBe(10000);
    expect(config.cache.enabled).toBe(false);
    expect(config.cache.ttl).toBe(600);
    expect(config.retry.maxAttempts).toBe(5);
    expect(config.circuitBreaker.failureThreshold).toBe(10);
  });
});
