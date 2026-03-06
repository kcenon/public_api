import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolveConfig, DEFAULT_CONFIG } from '../src/config.js';

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

  it('should throw when no service key is provided', () => {
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
});
