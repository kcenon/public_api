import { resolveConfig, type ResolvedConfig } from './config.js';
import type { SDKConfig } from './types/config.js';

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

  constructor(config: SDKConfig = {}) {
    this.config = resolveConfig(config);
  }

  /** Get the resolved SDK configuration (service key is masked). */
  getConfig(): Omit<ResolvedConfig, 'serviceKey'> & { serviceKey: string } {
    return {
      ...this.config,
      serviceKey: this.maskServiceKey(this.config.serviceKey),
    };
  }

  private maskServiceKey(key: string): string {
    if (key.length <= 8) return '****';
    return key.slice(0, 4) + '****' + key.slice(-4);
  }
}
