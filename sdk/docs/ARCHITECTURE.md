# Korea Public Data SDK - Architecture Design

## Overview

A universal TypeScript/JavaScript SDK for Korean government public data APIs (data.go.kr).

## Design Principles

1. **Unified Interface**: Single consistent API across all data providers
2. **Type Safety**: Full TypeScript support with strict typing
3. **Resilience**: Built-in retry, circuit breaker, and caching
4. **Extensibility**: Easy to add new API adapters
5. **Zero Configuration**: Sensible defaults, minimal setup required

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Application                         │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                      PublicDataSDK (Main Entry)                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  sdk.weather.getForecast()                               │   │
│  │  sdk.realestate.getTransactions()                        │   │
│  │  sdk.business.verify()                                   │   │
│  │  sdk.catalog.search()                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                        Adapter Layer                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Weather  │ │ RealEst  │ │ Business │ │ Transport│  ...     │
│  │ Adapter  │ │ Adapter  │ │ Adapter  │ │ Adapter  │          │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘          │
└───────┼────────────┼────────────┼────────────┼──────────────────┘
        │            │            │            │
┌───────▼────────────▼────────────▼────────────▼──────────────────┐
│                         Core Layer                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │ HttpClient  │ │ ResponsePar │ │ ErrorHandle │               │
│  │ + Retry     │ │ ser (XML/   │ │ r + Circuit │               │
│  │ + Auth      │ │ JSON)       │ │ Breaker     │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │ Cache Layer │ │ Rate Limit  │ │ Logger      │               │
│  │ (Memory/    │ │ er          │ │             │               │
│  │ Redis)      │ │             │ │             │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    Public Data Portal APIs
```

## Directory Structure

```
sdk/
├── src/
│   ├── index.ts                 # Main entry point
│   ├── client.ts                # PublicDataSDK class
│   ├── core/
│   │   ├── http-client.ts       # HTTP client with retry
│   │   ├── response-parser.ts   # XML/JSON response parser
│   │   ├── error-handler.ts     # Error handling & circuit breaker
│   │   ├── cache.ts             # Caching layer
│   │   ├── rate-limiter.ts      # Rate limiting
│   │   └── logger.ts            # Logging utility
│   ├── adapters/
│   │   ├── base-adapter.ts      # Abstract base adapter
│   │   ├── weather/             # Weather API adapter
│   │   │   ├── index.ts
│   │   │   ├── types.ts
│   │   │   └── endpoints.ts
│   │   ├── realestate/          # Real estate API adapter
│   │   ├── business/            # Business registration adapter
│   │   ├── transport/           # Transportation adapter
│   │   ├── address/             # Address lookup adapter
│   │   └── catalog/             # Meta API (catalog) adapter
│   ├── types/
│   │   ├── common.ts            # Common types
│   │   ├── config.ts            # Configuration types
│   │   ├── errors.ts            # Error types
│   │   └── responses.ts         # Response types
│   └── utils/
│       ├── encoding.ts          # URL encoding utilities
│       ├── date.ts              # Date formatting utilities
│       └── coordinates.ts       # Coordinate conversion
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── examples/
│   ├── basic-usage.ts
│   ├── with-caching.ts
│   └── error-handling.ts
└── docs/
    ├── ARCHITECTURE.md
    ├── API.md
    └── ADAPTERS.md
```

## Core Components

### 1. HttpClient

Handles all HTTP communication with built-in:
- Automatic retry with exponential backoff
- Request/response interceptors
- Timeout handling
- Service key injection

### 2. ResponseParser

Unified parser that handles:
- JSON responses
- XML responses (even when JSON requested)
- Error extraction from both formats
- Data normalization

### 3. ErrorHandler

Comprehensive error handling:
- Typed errors for different failure modes
- Circuit breaker pattern
- Error recovery strategies

### 4. Cache

Flexible caching:
- In-memory (default)
- Redis (optional)
- Custom TTL per data type
- Cache key generation

### 5. RateLimiter

Prevents API abuse:
- Per-API rate limiting
- Daily quota tracking
- Automatic throttling

## Adapter Pattern

Each API provider has a dedicated adapter:

```typescript
abstract class BaseAdapter {
  protected client: HttpClient;
  protected parser: ResponseParser;
  protected cache: Cache;

  abstract readonly name: string;
  abstract readonly baseUrl: string;

  protected async request<T>(endpoint: string, params: object): Promise<T>;
}

class WeatherAdapter extends BaseAdapter {
  readonly name = 'weather';
  readonly baseUrl = 'https://apis.data.go.kr/1360000';

  async getForecast(params: ForecastParams): Promise<ForecastResponse> {
    return this.request('/VilageFcstInfoService_2.0/getVilageFcst', params);
  }
}
```

## Configuration

```typescript
const sdk = new PublicDataSDK({
  // Required
  serviceKey: 'YOUR_API_KEY',

  // Optional
  cache: {
    enabled: true,
    ttl: {
      weather: 3600,      // 1 hour
      realestate: 21600,  // 6 hours
      holidays: 86400,    // 24 hours
    },
    adapter: 'memory', // or 'redis'
  },

  retry: {
    maxRetries: 3,
    baseDelay: 1000,
  },

  circuitBreaker: {
    enabled: true,
    threshold: 5,
    resetTimeout: 30000,
  },

  logging: {
    level: 'info',
  },
});
```

## Error Handling

```typescript
// Typed errors
class PublicDataError extends Error {
  code: string;
  originalResponse?: unknown;
}

class AuthenticationError extends PublicDataError {}
class RateLimitError extends PublicDataError {}
class NotFoundError extends PublicDataError {}
class ServiceUnavailableError extends PublicDataError {}

// Usage
try {
  const data = await sdk.weather.getForecast(params);
} catch (error) {
  if (error instanceof RateLimitError) {
    // Wait and retry
  } else if (error instanceof AuthenticationError) {
    // Check service key
  }
}
```

## Supported APIs (Initial Release)

### Phase 1 (MVP)
- [x] Weather (기상청 단기예보)
- [x] Business Registration (국세청 사업자등록)
- [x] Address (도로명주소)
- [x] Holidays (한국천문연구원 특일정보)
- [x] Catalog (메타 API)

### Phase 2
- [ ] Real Estate Transactions (국토부 실거래가)
- [ ] Building Registry (건축물대장)
- [ ] Bus Arrival (버스도착정보)
- [ ] Air Quality (대기오염정보)

### Phase 3
- [ ] KOSIS Statistics
- [ ] Bank of Korea ECOS
- [ ] Tourism API
- [ ] Healthcare Facilities

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 0.1.0 | 2026-02-05 | Initial architecture design |
