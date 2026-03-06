# @kcenon/public-data-sdk

TypeScript SDK for Korean Government Public Data APIs (공공데이터 SDK)

[![CI](https://github.com/kcenon/public_api/actions/workflows/ci.yml/badge.svg)](https://github.com/kcenon/public_api/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@kcenon/public-data-sdk)](https://www.npmjs.com/package/@kcenon/public-data-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A unified TypeScript SDK for accessing Korean government public data APIs. Provides type-safe access to weather forecasts, business registration, address search, holidays, public transport, air quality, and real estate transaction data.

## Features

- **7 API Adapters**: Weather, Business, Address, Holiday, Transport, Air Quality, Real Estate
- **Type-Safe**: Full TypeScript support with exported types for all parameters and responses
- **Resilient**: Built-in retry, circuit breaker, and caching
- **Flexible Caching**: In-memory (default) or Redis for multi-instance deployments
- **Dual Package**: ESM and CJS support
- **Node.js 18+**: Supports Node.js 18, 20, and 22

## Quick Start

### 1. Install

```bash
npm install @kcenon/public-data-sdk
```

### 2. Configure

```typescript
import { PublicDataSDK } from '@kcenon/public-data-sdk';

const sdk = new PublicDataSDK({
  serviceKey: 'YOUR_SERVICE_KEY', // from data.go.kr
});
```

### 3. Use

```typescript
// Weather forecast
const forecast = await sdk.weather.getVilageFcst({
  baseDate: '20240115',
  baseTime: '0500',
  latitude: 37.5665,
  longitude: 126.978,
});

// Business registration check
const status = await sdk.business.getStatus({
  businessNumbers: ['1234567890'],
});

// Address search
const addresses = await sdk.address.search({
  keyword: '테헤란로 131',
});
```

## Available Adapters

| Adapter     | Accessor         | API Source              | Cache TTL  |
| ----------- | ---------------- | ----------------------- | ---------- |
| Weather     | `sdk.weather`    | 기상청                  | 1 hour     |
| Business    | `sdk.business`   | 국세청                  | 24 hours   |
| Address     | `sdk.address`    | 행정안전부 (juso.go.kr) | 7 days     |
| Holiday     | `sdk.holiday`    | 한국천문연구원          | 30 days    |
| Transport   | `sdk.transport`  | 국토교통부              | 30 seconds |
| Air Quality | `sdk.airQuality` | 한국환경공단            | 1 hour     |
| Real Estate | `sdk.realEstate` | 국토교통부              | 24 hours   |

## Configuration

```typescript
const sdk = new PublicDataSDK({
  serviceKey: 'YOUR_KEY', // Required (or set PUBLIC_DATA_SERVICE_KEY env var)
  timeout: 30000, // Request timeout in ms (default: 30000)
  cache: {
    enabled: true, // Enable caching (default: true)
    ttl: 3600, // Default TTL in seconds (default: 3600)
    maxEntries: 1000, // Max cache entries (default: 1000)
  },
  retry: {
    maxAttempts: 3, // Max retry attempts (default: 3)
    baseDelay: 1000, // Base delay in ms (default: 1000)
    maxDelay: 30000, // Max delay in ms (default: 30000)
  },
  circuitBreaker: {
    failureThreshold: 5, // Failures before opening (default: 5)
    resetTimeout: 30000, // Time before half-open in ms (default: 30000)
  },
});
```

### Redis Cache

For multi-instance deployments, use Redis instead of in-memory cache:

```typescript
import Redis from 'ioredis';
import {
  PublicDataSDK,
  RedisCacheAdapter,
  CacheManager,
} from '@kcenon/public-data-sdk';

const redis = new Redis({ host: 'redis.example.com' });
const cacheAdapter = new RedisCacheAdapter(redis, 'myapp:');

const sdk = new PublicDataSDK({
  serviceKey: 'YOUR_KEY',
  // Pass a custom CacheManager with Redis adapter
});
```

## Error Handling

```typescript
import {
  ValidationError,
  AuthenticationError,
  NetworkError,
  CircuitOpenError,
} from '@kcenon/public-data-sdk';

try {
  const result = await sdk.weather.getVilageFcst({ ... });
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Invalid input:', error.message);
  } else if (error instanceof AuthenticationError) {
    console.error('Invalid service key');
  } else if (error instanceof NetworkError) {
    console.error('Network issue:', error.message);
  } else if (error instanceof CircuitOpenError) {
    console.error('Service temporarily unavailable');
  }
}
```

## Adapter Examples

### Weather

```typescript
// Short-term forecast
const forecast = await sdk.weather.getVilageFcst({
  baseDate: '20240115',
  baseTime: '0500',
  latitude: 37.5665, // Seoul
  longitude: 126.978,
});

// Ultra short-term observation
const observation = await sdk.weather.getUltraSrtNcst({
  baseDate: '20240115',
  baseTime: '1400',
  nx: 60,
  ny: 127,
});
```

### Business Registration

```typescript
// Check registration status
const status = await sdk.business.getStatus({
  businessNumbers: ['1234567890', '0987654321'],
});
status.data.forEach((biz) => {
  console.log(`${biz.businessNumber}: ${biz.status}`); // ACTIVE, SUSPENDED, CLOSED
});

// Verify business authenticity
const validation = await sdk.business.validate({
  businesses: [
    {
      businessNumber: '1234567890',
      startDate: '20200101',
      representativeName: '홍길동',
    },
  ],
});
```

### Address Search

```typescript
// Search addresses
const result = await sdk.address.search({
  keyword: '강남구 테헤란로',
  countPerPage: 10,
});
result.data.forEach((addr) => {
  console.log(addr.roadAddress, addr.postalCode);
});

// Quick postal code lookup
const postalCode = await sdk.address.getPostalCode('테헤란로 131');
```

### Holiday

```typescript
// Get holidays for a year
const holidays = await sdk.holiday.getHolidays({ year: 2024 });

// Check if a date is a holiday
const isHoliday = await sdk.holiday.isHoliday('20240101'); // true (New Year)
```

### Real Estate

```typescript
import { RealEstateAdapter } from '@kcenon/public-data-sdk';

// Apartment sales in Gangnam
const sales = await sdk.realEstate.getApartmentSales({
  lawdCd: '11680', // Gangnam-gu
  dealYmd: '202401', // January 2024
});
sales.data.forEach((tx) => {
  console.log(`${tx.name}: ${tx.priceFormatted}`); // "래미안: 1억 2,500만원"
});

// Price utilities
RealEstateAdapter.parsePrice('12,500'); // 125000000
RealEstateAdapter.formatPrice(125000000); // "1억 2,500만원"
```

## API Documentation

See the [docs](./docs) directory for complete API reference:

- [SDK Reference](./docs/api/sdk.md)
- [Error Types](./docs/api/errors.md)
- [Cache Configuration](./docs/api/cache.md)
- [Quickstart Guide](./docs/guides/quickstart.md)

## Requirements

- Node.js >= 18.0.0
- Service key from [data.go.kr](https://www.data.go.kr) (for most APIs)
- Service key from [juso.go.kr](https://business.juso.go.kr) (for Address adapter)

## License

MIT
