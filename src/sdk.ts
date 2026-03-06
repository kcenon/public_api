import { resolveConfig, type ResolvedConfig } from './config.js';
import type { SDKConfig } from './types/config.js';
import type { AdapterContext } from './types/adapter.js';
import { HttpClient } from './core/http-client.js';
import { CacheManager } from './core/cache.js';
import { ResponseParser } from './core/parser.js';
import { WeatherAdapter } from './adapters/weather/index.js';
import { BusinessAdapter } from './adapters/business/index.js';
import { AddressAdapter } from './adapters/address/index.js';
import { HolidayAdapter } from './adapters/holiday/index.js';
import { TransportAdapter } from './adapters/transport/index.js';
import { AirQualityAdapter } from './adapters/air-quality/index.js';

/**
 * Main entry point for the Public Data SDK.
 *
 * @example
 * ```typescript
 * const sdk = new PublicDataSDK({ serviceKey: 'YOUR_KEY' });
 * const forecast = await sdk.weather.getForecast({ ... });
 * ```
 */
export class PublicDataSDK {
  private readonly config: ResolvedConfig;
  private readonly httpClient: HttpClient;
  private readonly cache: CacheManager;
  private readonly parser: ResponseParser;
  private readonly adapters = new Map<string, unknown>();

  constructor(config: SDKConfig = {}) {
    this.config = resolveConfig(config);

    this.httpClient = new HttpClient({
      serviceKey: this.config.serviceKey,
      timeout: this.config.timeout,
      retry: this.config.retry,
    });

    this.cache = new CacheManager({
      enabled: this.config.cache.enabled,
      defaultTtl: this.config.cache.ttl,
      maxEntries: this.config.cache.maxEntries,
    });

    this.parser = new ResponseParser();
  }

  /** Get the resolved SDK configuration (service key is masked). */
  getConfig(): Omit<ResolvedConfig, 'serviceKey'> & { serviceKey: string } {
    return {
      ...this.config,
      serviceKey: this.maskServiceKey(this.config.serviceKey),
    };
  }

  /** Get the shared adapter context for creating adapters. */
  getAdapterContext(): AdapterContext {
    return {
      config: this.config,
      httpClient: this.httpClient,
      cache: this.cache,
      parser: this.parser,
    };
  }

  /** Lazily-loaded Weather adapter (기상청 API). */
  get weather(): WeatherAdapter {
    return this.getOrCreateAdapter(
      'weather',
      () => new WeatherAdapter(this.getAdapterContext()),
    );
  }

  /** Lazily-loaded Business Registration adapter (국세청 API). */
  get business(): BusinessAdapter {
    return this.getOrCreateAdapter(
      'business',
      () => new BusinessAdapter(this.getAdapterContext()),
    );
  }

  /** Lazily-loaded Holiday adapter (한국천문연구원 API). */
  get holiday(): HolidayAdapter {
    return this.getOrCreateAdapter(
      'holiday',
      () => new HolidayAdapter(this.getAdapterContext()),
    );
  }

  /** Lazily-loaded Transport adapter (국토교통부 대중교통 API). */
  get transport(): TransportAdapter {
    return this.getOrCreateAdapter(
      'transport',
      () => new TransportAdapter(this.getAdapterContext()),
    );
  }

  /** Lazily-loaded Address adapter (행정안전부 도로명주소 API). */
  get address(): AddressAdapter {
    return this.getOrCreateAdapter(
      'address',
      () => new AddressAdapter(this.getAdapterContext()),
    );
  }

  /** Lazily-loaded Air Quality adapter (한국환경공단 API). */
  get airQuality(): AirQualityAdapter {
    return this.getOrCreateAdapter(
      'air-quality',
      () => new AirQualityAdapter(this.getAdapterContext()),
    );
  }

  /** Get the cache manager for statistics and management. */
  getCacheManager(): CacheManager {
    return this.cache;
  }

  /**
   * Get or create a lazily-initialized adapter by name.
   * @internal Used by adapter accessor properties.
   */
  protected getOrCreateAdapter<T>(name: string, factory: () => T): T {
    let adapter = this.adapters.get(name);
    if (!adapter) {
      adapter = factory();
      this.adapters.set(name, adapter);
    }
    return adapter as T;
  }

  private maskServiceKey(key: string): string {
    if (key.length <= 8) return '****';
    return key.slice(0, 4) + '****' + key.slice(-4);
  }
}
