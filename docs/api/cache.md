# Cache Configuration

## Overview

The SDK includes a built-in caching layer to reduce API calls and improve performance. Caching is enabled by default with an in-memory adapter. For multi-instance deployments, a Redis adapter is available.

## Configuration

```typescript
const sdk = new PublicDataSDK({
  serviceKey: 'YOUR_KEY',
  cache: {
    enabled: true, // Enable/disable caching (default: true)
    ttl: 3600, // Default TTL in seconds (default: 3600)
    maxEntries: 1000, // Max in-memory cache entries (default: 1000)
  },
});
```

| Option       | Type      | Default | Description                         |
| ------------ | --------- | ------- | ----------------------------------- |
| `enabled`    | `boolean` | `true`  | Enable or disable caching           |
| `ttl`        | `number`  | `3600`  | Default cache TTL in seconds        |
| `maxEntries` | `number`  | `1000`  | Maximum entries for in-memory cache |

## Adapter-Specific TTLs

Each adapter uses a TTL appropriate for its data freshness requirements. These override the global default:

| Adapter     | TTL                  | Rationale                              |
| ----------- | -------------------- | -------------------------------------- |
| Weather     | 1 hour (3,600s)      | Forecasts update hourly                |
| Business    | 24 hours (86,400s)   | Registration data changes infrequently |
| Address     | 7 days (604,800s)    | Addresses rarely change                |
| Holiday     | 30 days (2,592,000s) | Holiday data is static per year        |
| Transport   | 30 seconds           | Real-time arrival data                 |
| Air Quality | 1 hour (3,600s)      | Measurements update hourly             |
| Real Estate | 24 hours (86,400s)   | Transaction data updates daily         |

## Cache Statistics

Monitor cache performance via `CacheManager`:

```typescript
const cacheManager = sdk.getCacheManager();
const stats = await cacheManager.getStats();

console.log(`Hits: ${stats.hits}`);
console.log(`Misses: ${stats.misses}`);
console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
console.log(`Size: ${stats.size} entries`);
```

### CacheStats Interface

| Property  | Type     | Description                      |
| --------- | -------- | -------------------------------- |
| `hits`    | `number` | Number of cache hits             |
| `misses`  | `number` | Number of cache misses           |
| `hitRate` | `number` | Hit rate (0 to 1)                |
| `size`    | `number` | Current number of cached entries |

## In-Memory Cache (Default)

The default `MemoryCacheAdapter` provides:

- **TTL-based expiration**: Entries automatically expire after their TTL
- **LRU eviction**: When `maxEntries` is reached, least recently used entries are evicted
- **Automatic cleanup**: Expired entries are cleaned up periodically

Suitable for single-instance deployments with moderate traffic.

## Redis Cache

For multi-instance deployments, use `RedisCacheAdapter` to share cache across instances.

### Setup

```typescript
import Redis from 'ioredis';
import {
  PublicDataSDK,
  RedisCacheAdapter,
  CacheManager,
} from '@kcenon/public-data-sdk';

// Create Redis client
const redis = new Redis({
  host: 'redis.example.com',
  port: 6379,
});

// Create Redis cache adapter with optional key prefix
const cacheAdapter = new RedisCacheAdapter(redis, 'myapp:');

// Create CacheManager with Redis adapter
const cacheManager = new CacheManager({
  enabled: true,
  ttl: 3600,
  adapter: cacheAdapter,
});
```

### RedisLikeClient Interface

The `RedisCacheAdapter` accepts any Redis client implementing this interface, making it compatible with `ioredis` and similar libraries:

```typescript
interface RedisLikeClient {
  get(key: string): Promise<string | null>;
  setex(key: string, seconds: number, value: string): Promise<string>;
  del(...keys: string[]): Promise<number>;
  exists(key: string): Promise<number>;
  scan(
    cursor: string,
    ...args: (string | number)[]
  ): Promise<[string, string[]]>;
  quit(): Promise<string>;
}
```

### Key Prefix

The `keyPrefix` parameter (default: `'pdsdk:'`) namespaces all cache keys to avoid collisions with other applications sharing the same Redis instance.

```typescript
// Keys stored as: "myapp:weather:vilagefcst:..."
const adapter = new RedisCacheAdapter(redis, 'myapp:');
```

### Graceful Degradation

The Redis adapter handles errors gracefully — if Redis is unavailable, cache operations fail silently and the SDK falls back to making direct API calls.

### Cleanup

Disconnect the Redis client when shutting down:

```typescript
const adapter = new RedisCacheAdapter(redis);
// ... use SDK ...
await adapter.disconnect();
```

## Disabling Cache

To disable caching entirely:

```typescript
const sdk = new PublicDataSDK({
  serviceKey: 'YOUR_KEY',
  cache: {
    enabled: false,
  },
});
```
