import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PublicDataSDK } from '../src/sdk.js';
import { CacheManager } from '../src/core/cache.js';

describe('PublicDataSDK', () => {
  const originalEnv = process.env.PUBLIC_DATA_API_KEY;

  beforeEach(() => {
    delete process.env.PUBLIC_DATA_API_KEY;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.PUBLIC_DATA_API_KEY = originalEnv;
    } else {
      delete process.env.PUBLIC_DATA_API_KEY;
    }
  });

  describe('Initialization', () => {
    it('should create SDK instance with service key', () => {
      const sdk = new PublicDataSDK({ serviceKey: 'test-key-12345678' });
      expect(sdk).toBeInstanceOf(PublicDataSDK);
    });

    it('should throw when no service key is provided', () => {
      expect(() => new PublicDataSDK()).toThrow('Service key is required');
    });

    it('should load service key from environment variable', () => {
      process.env.PUBLIC_DATA_API_KEY = 'env-key-123456789';
      const sdk = new PublicDataSDK();
      const config = sdk.getConfig();
      expect(config.serviceKey).toBe('env-****6789');
    });
  });

  describe('Configuration', () => {
    it('should mask service key in getConfig', () => {
      const sdk = new PublicDataSDK({ serviceKey: 'abcdefghijklmnop' });
      const config = sdk.getConfig();
      expect(config.serviceKey).toBe('abcd****mnop');
      expect(config.serviceKey).not.toBe('abcdefghijklmnop');
    });

    it('should mask short service key', () => {
      const sdk = new PublicDataSDK({ serviceKey: 'short' });
      const config = sdk.getConfig();
      expect(config.serviceKey).toBe('****');
    });

    it('should merge user config with defaults', () => {
      const sdk = new PublicDataSDK({
        serviceKey: 'test-key-12345678',
        timeout: 5000,
        cache: { ttl: 600 },
      });
      const config = sdk.getConfig();
      expect(config.timeout).toBe(5000);
      expect(config.cache.ttl).toBe(600);
      expect(config.cache.enabled).toBe(true);
    });
  });

  describe('Core modules', () => {
    it('should expose adapter context', () => {
      const sdk = new PublicDataSDK({ serviceKey: 'test-key-12345678' });
      const context = sdk.getAdapterContext();
      expect(context.config).toBeDefined();
      expect(context.httpClient).toBeDefined();
      expect(context.cache).toBeDefined();
      expect(context.parser).toBeDefined();
    });

    it('should return the same adapter context on multiple calls', () => {
      const sdk = new PublicDataSDK({ serviceKey: 'test-key-12345678' });
      const ctx1 = sdk.getAdapterContext();
      const ctx2 = sdk.getAdapterContext();
      expect(ctx1.httpClient).toBe(ctx2.httpClient);
      expect(ctx1.cache).toBe(ctx2.cache);
      expect(ctx1.parser).toBe(ctx2.parser);
    });

    it('should expose cache manager', () => {
      const sdk = new PublicDataSDK({ serviceKey: 'test-key-12345678' });
      const cache = sdk.getCacheManager();
      expect(cache).toBeInstanceOf(CacheManager);
    });

    it('should pass cache config to CacheManager', async () => {
      const sdk = new PublicDataSDK({
        serviceKey: 'test-key-12345678',
        cache: { enabled: false },
      });
      const cache = sdk.getCacheManager();
      // When cache is disabled, get always returns undefined
      await cache.set('key', 'value');
      const result = await cache.get('key');
      expect(result).toBeUndefined();
    });
  });

  describe('Lazy adapter loading', () => {
    it('should provide getOrCreateAdapter via subclass', () => {
      class TestSDK extends PublicDataSDK {
        getTestAdapter(): string {
          return this.getOrCreateAdapter('test', () => 'test-adapter');
        }
      }

      const sdk = new TestSDK({ serviceKey: 'test-key-12345678' });
      const adapter1 = sdk.getTestAdapter();
      const adapter2 = sdk.getTestAdapter();
      expect(adapter1).toBe('test-adapter');
      expect(adapter1).toBe(adapter2);
    });
  });
});
