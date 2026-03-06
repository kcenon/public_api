# Quickstart Guide

## Prerequisites

- Node.js 18 or later
- A service key from [data.go.kr](https://www.data.go.kr) (most APIs)
- A service key from [juso.go.kr](https://business.juso.go.kr) (Address adapter only)

## Installation

```bash
npm install @kcenon/public-data-sdk
```

## Basic Setup

```typescript
import { PublicDataSDK } from '@kcenon/public-data-sdk';

const sdk = new PublicDataSDK({
  serviceKey: 'YOUR_SERVICE_KEY',
});
```

Or use an environment variable:

```bash
export PUBLIC_DATA_SERVICE_KEY=YOUR_SERVICE_KEY
```

```typescript
// Automatically uses PUBLIC_DATA_SERVICE_KEY env var
const sdk = new PublicDataSDK();
```

## Your First API Call

### Weather Forecast

```typescript
const forecast = await sdk.weather.getVilageFcst({
  baseDate: '20240115',
  baseTime: '0500',
  latitude: 37.5665, // Seoul
  longitude: 126.978,
});

forecast.data.forEach((item) => {
  console.log(`${item.category}: ${item.fcstValue}`);
});
```

### Business Registration Check

```typescript
const status = await sdk.business.getStatus({
  businessNumbers: ['1234567890'],
});

status.data.forEach((biz) => {
  console.log(`${biz.businessNumber}: ${biz.status}`);
});
```

### Address Search

```typescript
const result = await sdk.address.search({
  keyword: '테헤란로 131',
});

result.data.forEach((addr) => {
  console.log(`${addr.roadAddress} (${addr.postalCode})`);
});
```

## Error Handling

```typescript
import {
  ValidationError,
  AuthenticationError,
  NetworkError,
} from '@kcenon/public-data-sdk';

try {
  const result = await sdk.weather.getVilageFcst({
    baseDate: '20240115',
    baseTime: '0500',
    latitude: 37.5665,
    longitude: 126.978,
  });
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Invalid parameters:', error.message);
  } else if (error instanceof AuthenticationError) {
    console.error('Check your service key');
  } else if (error instanceof NetworkError) {
    console.error('Network issue:', error.message);
  }
}
```

## Available Adapters

| Adapter     | Accessor         | Description                        |
| ----------- | ---------------- | ---------------------------------- |
| Weather     | `sdk.weather`    | Weather forecasts (KMA)            |
| Business    | `sdk.business`   | Business registration verification |
| Address     | `sdk.address`    | Address search (juso.go.kr)        |
| Holiday     | `sdk.holiday`    | Korean holiday information         |
| Transport   | `sdk.transport`  | Public transport (bus arrivals)    |
| Air Quality | `sdk.airQuality` | Air quality measurements           |
| Real Estate | `sdk.realEstate` | Real estate transactions           |

## Configuration Options

```typescript
const sdk = new PublicDataSDK({
  serviceKey: 'YOUR_KEY',
  timeout: 30000, // Request timeout (ms)
  cache: {
    enabled: true, // Enable caching
    ttl: 3600, // Default TTL (seconds)
    maxEntries: 1000, // Max cache entries
  },
  retry: {
    maxAttempts: 3, // Max retry attempts
    baseDelay: 1000, // Base delay between retries (ms)
    maxDelay: 30000, // Max delay between retries (ms)
  },
  circuitBreaker: {
    failureThreshold: 5, // Failures before circuit opens
    resetTimeout: 30000, // Time before circuit resets (ms)
  },
});
```

## Next Steps

- [SDK Reference](../api/sdk.md) — Full SDK API documentation
- [Error Types](../api/errors.md) — Detailed error type reference
- [Cache Configuration](../api/cache.md) — Cache setup and Redis integration
