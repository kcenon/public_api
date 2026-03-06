# SDK Reference

## PublicDataSDK

Main entry point for all API interactions.

### Constructor

```typescript
new PublicDataSDK(config?: SDKConfig)
```

| Parameter                         | Type      | Default                       | Description                   |
| --------------------------------- | --------- | ----------------------------- | ----------------------------- |
| `serviceKey`                      | `string`  | `PUBLIC_DATA_SERVICE_KEY` env | API service key               |
| `timeout`                         | `number`  | `30000`                       | Request timeout (ms)          |
| `cache.enabled`                   | `boolean` | `true`                        | Enable caching                |
| `cache.ttl`                       | `number`  | `3600`                        | Default cache TTL (seconds)   |
| `cache.maxEntries`                | `number`  | `1000`                        | Max in-memory cache entries   |
| `retry.maxAttempts`               | `number`  | `3`                           | Max retry attempts            |
| `retry.baseDelay`                 | `number`  | `1000`                        | Base retry delay (ms)         |
| `retry.maxDelay`                  | `number`  | `30000`                       | Max retry delay (ms)          |
| `circuitBreaker.failureThreshold` | `number`  | `5`                           | Failures before circuit opens |
| `circuitBreaker.resetTimeout`     | `number`  | `30000`                       | Circuit reset timeout (ms)    |

### Adapter Properties

All adapters are lazily initialized on first access.

| Property         | Type                | Description                 |
| ---------------- | ------------------- | --------------------------- |
| `sdk.weather`    | `WeatherAdapter`    | Weather forecast API        |
| `sdk.business`   | `BusinessAdapter`   | Business registration API   |
| `sdk.address`    | `AddressAdapter`    | Address search API          |
| `sdk.holiday`    | `HolidayAdapter`    | Holiday information API     |
| `sdk.transport`  | `TransportAdapter`  | Public transport API        |
| `sdk.airQuality` | `AirQualityAdapter` | Air quality API             |
| `sdk.realEstate` | `RealEstateAdapter` | Real estate transaction API |

### Methods

#### `getConfig()`

Returns the resolved configuration with masked service key.

#### `getAdapterContext()`

Returns the shared adapter context for custom adapter creation.

#### `getCacheManager()`

Returns the cache manager for statistics and cache management.

```typescript
const stats = await sdk.getCacheManager().getStats();
console.log(`Cache hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
```
