# Error Types

## Error Hierarchy

All SDK errors extend `PublicDataError`, which extends the native `Error` class.

```
Error
└── PublicDataError
    ├── AuthenticationError
    ├── RateLimitError
    ├── ValidationError
    ├── NotFoundError
    ├── ServiceUnavailableError
    ├── NetworkError
    ├── ParseError
    └── CircuitOpenError
```

## PublicDataError (Base)

Base class for all SDK errors.

```typescript
import { PublicDataError } from '@kcenon/public-data-sdk';
```

| Property        | Type                  | Description                          |
| --------------- | --------------------- | ------------------------------------ |
| `message`       | `string`              | Error message                        |
| `code`          | `string`              | Error code identifier                |
| `statusCode`    | `number \| undefined` | HTTP status code                     |
| `retryable`     | `boolean`             | Whether the operation can be retried |
| `originalError` | `Error \| undefined`  | Original underlying error            |
| `timestamp`     | `Date`                | When the error occurred              |

### `toJSON()`

All errors implement `toJSON()` for structured logging:

```typescript
try {
  await sdk.weather.getVilageFcst({ ... });
} catch (error) {
  if (error instanceof PublicDataError) {
    console.log(JSON.stringify(error.toJSON(), null, 2));
    // { code, message, statusCode, retryable, timestamp }
  }
}
```

## Error Types

### AuthenticationError

Thrown when the service key is invalid or missing.

| Property     | Value   |
| ------------ | ------- |
| `statusCode` | `401`   |
| `retryable`  | `false` |

```typescript
import { AuthenticationError } from '@kcenon/public-data-sdk';

try {
  await sdk.weather.getVilageFcst({ ... });
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Invalid service key');
  }
}
```

### RateLimitError

Thrown when API rate limits are exceeded.

| Property     | Value                                   |
| ------------ | --------------------------------------- |
| `statusCode` | `429`                                   |
| `retryable`  | `true`                                  |
| `retryAfter` | `number \| undefined` — seconds to wait |

```typescript
import { RateLimitError } from '@kcenon/public-data-sdk';

if (error instanceof RateLimitError) {
  console.log(`Rate limited. Retry after ${error.retryAfter}s`);
}
```

### ValidationError

Thrown when request parameters fail validation.

| Property     | Value                                          |
| ------------ | ---------------------------------------------- |
| `statusCode` | `400`                                          |
| `retryable`  | `false`                                        |
| `field`      | `string \| undefined` — invalid field name     |
| `constraint` | `string \| undefined` — constraint description |

```typescript
import { ValidationError } from '@kcenon/public-data-sdk';

if (error instanceof ValidationError) {
  console.error(`Invalid ${error.field}: ${error.constraint}`);
}
```

### NotFoundError

Thrown when the requested resource is not found.

| Property     | Value   |
| ------------ | ------- |
| `statusCode` | `404`   |
| `retryable`  | `false` |

### ServiceUnavailableError

Thrown when the upstream API is temporarily unavailable.

| Property     | Value  |
| ------------ | ------ |
| `statusCode` | `503`  |
| `retryable`  | `true` |

### NetworkError

Thrown on network-level failures (timeouts, DNS resolution, connection refused).

| Property     | Value       |
| ------------ | ----------- |
| `statusCode` | `undefined` |
| `retryable`  | `true`      |

```typescript
import { NetworkError } from '@kcenon/public-data-sdk';

if (error instanceof NetworkError) {
  console.error('Network issue:', error.message);
  // The SDK will automatically retry based on retry config
}
```

### ParseError

Thrown when the API response cannot be parsed.

| Property      | Value                                            |
| ------------- | ------------------------------------------------ |
| `retryable`   | `false`                                          |
| `rawResponse` | `string \| undefined` — the unparseable response |

### CircuitOpenError

Thrown when the circuit breaker is open due to repeated failures.

| Property      | Value                                      |
| ------------- | ------------------------------------------ |
| `statusCode`  | `503`                                      |
| `retryable`   | `true`                                     |
| `adapterName` | `string` — which adapter's circuit is open |

```typescript
import { CircuitOpenError } from '@kcenon/public-data-sdk';

if (error instanceof CircuitOpenError) {
  console.error(`${error.adapterName} is temporarily unavailable`);
  // Circuit will reset after circuitBreaker.resetTimeout (default: 30s)
}
```

## Error Handling Patterns

### Comprehensive Error Handling

```typescript
import {
  PublicDataError,
  ValidationError,
  AuthenticationError,
  NetworkError,
  RateLimitError,
  CircuitOpenError,
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
    // Fix input parameters
    console.error(`Invalid ${error.field}: ${error.constraint}`);
  } else if (error instanceof AuthenticationError) {
    // Check service key
    console.error('Invalid service key');
  } else if (error instanceof RateLimitError) {
    // Wait and retry
    const delay = (error.retryAfter ?? 60) * 1000;
    setTimeout(() => {
      /* retry */
    }, delay);
  } else if (error instanceof CircuitOpenError) {
    // Service temporarily unavailable, use fallback
    console.error(`${error.adapterName} circuit is open`);
  } else if (error instanceof NetworkError) {
    // Network issue, SDK already retried
    console.error('Network error after retries:', error.message);
  } else if (error instanceof PublicDataError) {
    // Other SDK errors
    console.error(`SDK error [${error.code}]: ${error.message}`);
  } else {
    // Non-SDK errors
    throw error;
  }
}
```

### Retry-Aware Handling

```typescript
if (error instanceof PublicDataError && error.retryable) {
  // Safe to retry — SDK already retried based on config
  // Consider increasing timeout or adjusting retry settings
  console.log('Retryable error after max attempts:', error.message);
} else {
  // Not retryable — fix input or configuration
  console.error('Non-retryable error:', error.message);
}
```
