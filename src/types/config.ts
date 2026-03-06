/**
 * SDK configuration types.
 */

/** Main SDK configuration. */
export interface SDKConfig {
  /** Service key from data.go.kr portal. */
  serviceKey?: string;
  /** Request timeout in milliseconds. Default: 30000. */
  timeout?: number;
  /** Cache configuration. */
  cache?: CacheConfig;
  /** Retry configuration. */
  retry?: RetryConfig;
  /** Circuit breaker configuration. */
  circuitBreaker?: CircuitBreakerConfig;
}

/** Cache configuration. */
export interface CacheConfig {
  /** Enable caching. Default: true. */
  enabled?: boolean;
  /** Default TTL in seconds. Default: 3600. */
  ttl?: number;
  /** Maximum number of cached entries. Default: 1000. */
  maxEntries?: number;
}

/** Retry configuration. */
export interface RetryConfig {
  /** Maximum number of retry attempts. Default: 3. */
  maxAttempts?: number;
  /** Base delay in milliseconds. Default: 1000. */
  baseDelay?: number;
  /** Maximum delay in milliseconds. Default: 30000. */
  maxDelay?: number;
  /** HTTP status codes to retry on. Default: [500, 502, 503, 504]. */
  retryableStatusCodes?: number[];
}

/** Circuit breaker configuration. */
export interface CircuitBreakerConfig {
  /** Failure count to open circuit. Default: 5. */
  failureThreshold?: number;
  /** Time in ms before trying half-open. Default: 30000. */
  resetTimeout?: number;
  /** Max attempts in half-open state. Default: 1. */
  halfOpenMaxAttempts?: number;
}
