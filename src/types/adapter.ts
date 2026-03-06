/**
 * Adapter context types for the Public Data SDK.
 */

import type { ResolvedConfig } from '../config.js';
import type { HttpClient } from '../core/http-client.js';
import type { CacheManager } from '../core/cache.js';
import type { ResponseParser } from '../core/parser.js';

/** Shared context passed to all adapters. */
export interface AdapterContext {
  readonly config: ResolvedConfig;
  readonly httpClient: HttpClient;
  readonly cache: CacheManager;
  readonly parser: ResponseParser;
}
