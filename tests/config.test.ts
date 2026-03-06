import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolveConfig, DEFAULT_CONFIG } from '../src/config.js';
import { ValidationError } from '../src/core/errors.js';

describe('resolveConfig', () => {
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

  it('should resolve config with explicit service key', () => {
    const config = resolveConfig({ serviceKey: 'test-key-123' });
    expect(config.serviceKey).toBe('test-key-123');
  });

  it('should load service key from environment variable', () => {
    process.env.PUBLIC_DATA_API_KEY = 'env-key-456';
    const config = resolveConfig({});
    expect(config.serviceKey).toBe('env-key-456');
  });

  it('should throw ValidationError when no service key is provided', () => {
    expect(() => resolveConfig({})).toThrow(ValidationError);
    expect(() => resolveConfig({})).toThrow('Service key is required');
  });

  it('should apply default values', () => {
    const config = resolveConfig({ serviceKey: 'key' });
    expect(config.timeout).toBe(DEFAULT_CONFIG.timeout);
    expect(config.cache.enabled).toBe(DEFAULT_CONFIG.cache.enabled);
    expect(config.cache.ttl).toBe(DEFAULT_CONFIG.cache.ttl);
    expect(config.retry.maxAttempts).toBe(DEFAULT_CONFIG.retry.maxAttempts);
    expect(config.circuitBreaker.failureThreshold).toBe(
      DEFAULT_CONFIG.circuitBreaker.failureThreshold,
    );
  });

  it('should override defaults with user config', () => {
    const config = resolveConfig({
      serviceKey: 'key',
      timeout: 5000,
      cache: { ttl: 600 },
      retry: { maxAttempts: 5 },
    });
    expect(config.timeout).toBe(5000);
    expect(config.cache.ttl).toBe(600);
    expect(config.cache.enabled).toBe(true); // default preserved
    expect(config.retry.maxAttempts).toBe(5);
    expect(config.retry.baseDelay).toBe(DEFAULT_CONFIG.retry.baseDelay); // default preserved
  });

  it('should prefer explicit config over env variable', () => {
    process.env.PUBLIC_DATA_API_KEY = 'env-key';
    const config = resolveConfig({ serviceKey: 'explicit-key' });
    expect(config.serviceKey).toBe('explicit-key');
  });

  describe('Configuration validation', () => {
    it('should reject negative timeout', () => {
      expect(() =>
        resolveConfig({ serviceKey: 'key', timeout: -1 }),
      ).toThrow(ValidationError);
    });

    it('should reject zero timeout', () => {
      expect(() =>
        resolveConfig({ serviceKey: 'key', timeout: 0 }),
      ).toThrow(ValidationError);
    });

    it('should reject NaN timeout', () => {
      expect(() =>
        resolveConfig({ serviceKey: 'key', timeout: NaN }),
      ).toThrow(ValidationError);
    });

    it('should reject Infinity timeout', () => {
      expect(() =>
        resolveConfig({ serviceKey: 'key', timeout: Infinity }),
      ).toThrow(ValidationError);
    });

    it('should reject non-integer maxEntries', () => {
      expect(() =>
        resolveConfig({ serviceKey: 'key', cache: { maxEntries: 1.5 } }),
      ).toThrow(ValidationError);
    });

    it('should reject negative cache TTL', () => {
      expect(() =>
        resolveConfig({ serviceKey: 'key', cache: { ttl: -100 } }),
      ).toThrow(ValidationError);
    });

    it('should reject non-integer retry maxAttempts', () => {
      expect(() =>
        resolveConfig({ serviceKey: 'key', retry: { maxAttempts: 2.5 } }),
      ).toThrow(ValidationError);
    });

    it('should reject negative retry baseDelay', () => {
      expect(() =>
        resolveConfig({ serviceKey: 'key', retry: { baseDelay: -1 } }),
      ).toThrow(ValidationError);
    });

    it('should reject non-integer circuit breaker failureThreshold', () => {
      expect(() =>
        resolveConfig({
          serviceKey: 'key',
          circuitBreaker: { failureThreshold: 3.5 },
        }),
      ).toThrow(ValidationError);
    });

    it('should reject negative circuit breaker resetTimeout', () => {
      expect(() =>
        resolveConfig({
          serviceKey: 'key',
          circuitBreaker: { resetTimeout: -1000 },
        }),
      ).toThrow(ValidationError);
    });

    it('should include field name in ValidationError', () => {
      try {
        resolveConfig({ serviceKey: 'key', timeout: -1 });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).field).toBe('timeout');
      }
    });

    it('should accept valid custom configuration', () => {
      const config = resolveConfig({
        serviceKey: 'key',
        timeout: 10000,
        cache: { ttl: 300, maxEntries: 500, enabled: false },
        retry: { maxAttempts: 5, baseDelay: 2000, maxDelay: 60000 },
        circuitBreaker: { failureThreshold: 10, resetTimeout: 60000 },
      });
      expect(config.timeout).toBe(10000);
      expect(config.cache.ttl).toBe(300);
      expect(config.cache.maxEntries).toBe(500);
      expect(config.cache.enabled).toBe(false);
      expect(config.retry.maxAttempts).toBe(5);
      expect(config.circuitBreaker.failureThreshold).toBe(10);
    });
  });
});
