// Public Data SDK - Main exports
export { PublicDataSDK } from './sdk.js';

// Configuration
export { DEFAULT_CONFIG, resolveConfig } from './config.js';
export type { ResolvedConfig } from './config.js';

// Types
export type {
  SDKConfig,
  CacheConfig,
  RetryConfig,
  CircuitBreakerConfig,
} from './types/config.js';
export type {
  ApiResponse,
  PaginationInfo,
  ResponseMeta,
} from './types/common.js';
export type {
  RawApiResponse,
  RawApiResponseHeader,
  RawApiResponseBody,
} from './types/response.js';
export type { AdapterContext } from './types/adapter.js';

// Core
export { ResponseParser } from './core/parser.js';
export { CacheManager, MemoryCacheAdapter } from './core/cache.js';
export type { CacheAdapter, CacheStats } from './core/cache.js';
export { CircuitBreaker } from './core/circuit-breaker.js';
export type {
  CircuitState,
  CircuitStateChangeEvent,
} from './core/circuit-breaker.js';

// Adapters
export { BaseAdapter } from './adapters/base.js';
export type { AdapterRequestConfig } from './adapters/base.js';
export { WeatherAdapter } from './adapters/weather/index.js';
export type {
  WeatherForecastParams,
  WeatherForecast,
  WeatherObservation,
} from './adapters/weather/types.js';
export {
  latLngToGrid,
  getCategoryName,
  getValueDescription,
} from './adapters/weather/utils.js';

// Errors
export {
  PublicDataError,
  AuthenticationError,
  RateLimitError,
  ValidationError,
  NotFoundError,
  ServiceUnavailableError,
  NetworkError,
  ParseError,
  CircuitOpenError,
} from './core/errors.js';
