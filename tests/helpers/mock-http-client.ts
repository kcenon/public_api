import { vi } from 'vitest';
import type { AdapterContext } from '../../src/types/adapter.js';
import type { ResolvedConfig } from '../../src/config.js';
import { CacheManager } from '../../src/core/cache.js';
import { ResponseParser } from '../../src/core/parser.js';

/** Default resolved config for testing. */
const defaultConfig: ResolvedConfig = {
  serviceKey: 'test-service-key',
  timeout: 5000,
  cache: { enabled: true, ttl: 3600, maxEntries: 100 },
  retry: {
    maxAttempts: 0,
    baseDelay: 100,
    maxDelay: 1000,
    retryableStatusCodes: [500, 502, 503],
  },
  circuitBreaker: {
    failureThreshold: 3,
    resetTimeout: 1000,
    halfOpenMaxAttempts: 1,
  },
};

/**
 * Create an AdapterContext with a real parser and cache but mocked HTTP client.
 * The httpClient.request is a Vitest mock function that can be configured
 * to return fixture-based responses.
 */
export function createTestContext(
  configOverrides: Partial<ResolvedConfig> = {},
): AdapterContext & { httpClient: { request: ReturnType<typeof vi.fn> } } {
  const config = { ...defaultConfig, ...configOverrides };

  return {
    config,
    httpClient: {
      request: vi.fn(),
    },
    cache: new CacheManager({
      enabled: config.cache.enabled,
      defaultTtl: config.cache.ttl,
      maxEntries: config.cache.maxEntries,
    }),
    parser: new ResponseParser(),
  };
}

/**
 * Create an AdapterContext with cache disabled.
 */
export function createTestContextNoCache(
  configOverrides: Partial<ResolvedConfig> = {},
): AdapterContext & { httpClient: { request: ReturnType<typeof vi.fn> } } {
  return createTestContext({
    ...configOverrides,
    cache: { enabled: false, ttl: 0, maxEntries: 0 },
  });
}
