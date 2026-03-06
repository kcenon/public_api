import type { SDKConfig } from './types/config.js';

/** Default SDK configuration values. */
export const DEFAULT_CONFIG = {
  timeout: 30_000,
  cache: {
    enabled: true,
    ttl: 3600,
    maxEntries: 1000,
  },
  retry: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30_000,
    retryableStatusCodes: [500, 502, 503, 504],
  },
  circuitBreaker: {
    failureThreshold: 5,
    resetTimeout: 30_000,
    halfOpenMaxAttempts: 1,
  },
} as const;

/** Resolved configuration with all defaults applied. */
export interface ResolvedConfig {
  serviceKey: string;
  timeout: number;
  cache: Required<NonNullable<SDKConfig['cache']>>;
  retry: Required<NonNullable<SDKConfig['retry']>>;
  circuitBreaker: Required<NonNullable<SDKConfig['circuitBreaker']>>;
}

/** Resolve user configuration with defaults. */
export function resolveConfig(config: SDKConfig): ResolvedConfig {
  const serviceKey = config.serviceKey ?? process.env.PUBLIC_DATA_API_KEY ?? '';

  if (!serviceKey) {
    throw new Error(
      'Service key is required. Provide it via config.serviceKey or PUBLIC_DATA_API_KEY environment variable.',
    );
  }

  return {
    serviceKey,
    timeout: config.timeout ?? DEFAULT_CONFIG.timeout,
    cache: {
      enabled: config.cache?.enabled ?? DEFAULT_CONFIG.cache.enabled,
      ttl: config.cache?.ttl ?? DEFAULT_CONFIG.cache.ttl,
      maxEntries: config.cache?.maxEntries ?? DEFAULT_CONFIG.cache.maxEntries,
    },
    retry: {
      maxAttempts:
        config.retry?.maxAttempts ?? DEFAULT_CONFIG.retry.maxAttempts,
      baseDelay: config.retry?.baseDelay ?? DEFAULT_CONFIG.retry.baseDelay,
      maxDelay: config.retry?.maxDelay ?? DEFAULT_CONFIG.retry.maxDelay,
      retryableStatusCodes: config.retry?.retryableStatusCodes ?? [
        ...DEFAULT_CONFIG.retry.retryableStatusCodes,
      ],
    },
    circuitBreaker: {
      failureThreshold:
        config.circuitBreaker?.failureThreshold ??
        DEFAULT_CONFIG.circuitBreaker.failureThreshold,
      resetTimeout:
        config.circuitBreaker?.resetTimeout ??
        DEFAULT_CONFIG.circuitBreaker.resetTimeout,
      halfOpenMaxAttempts:
        config.circuitBreaker?.halfOpenMaxAttempts ??
        DEFAULT_CONFIG.circuitBreaker.halfOpenMaxAttempts,
    },
  };
}
