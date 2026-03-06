import type { AdapterContext } from '../types/adapter.js';
import type { ApiResponse, PaginationInfo } from '../types/common.js';
import { CacheManager } from '../core/cache.js';
import { CircuitBreaker } from '../core/circuit-breaker.js';
import { ValidationError } from '../core/errors.js';

/** Request configuration for adapter methods. */
export interface AdapterRequestConfig {
  /** API endpoint path (e.g., '/getVilageFcst'). */
  path: string;
  /** Query parameters to include in the request. */
  params?: Record<string, string | number | undefined>;
  /** Override the default service key parameter name. */
  serviceKeyParam?: string;
  /** Override the default cache TTL in seconds. */
  ttl?: number;
  /** Pagination: page number (default: 1). */
  pageNo?: number;
  /** Pagination: number of rows per page (default: 10). */
  numOfRows?: number;
}

/**
 * Abstract base class for all API adapters.
 *
 * Provides a shared request pipeline:
 *   circuit breaker → cache check → HTTP request → parse → cache store
 *
 * Subclasses implement adapter-specific configuration and API methods.
 */
export abstract class BaseAdapter {
  /** Adapter name for logging and cache key namespacing. */
  readonly name: string;
  private readonly circuitBreaker: CircuitBreaker;

  constructor(protected readonly context: AdapterContext) {
    this.name = this.getAdapterName();
    this.circuitBreaker = new CircuitBreaker(
      this.name,
      context.config.circuitBreaker,
    );
  }

  /** Unique adapter identifier used for cache keys and logging. */
  protected abstract getAdapterName(): string;

  /** Base URL for the API (e.g., 'apis.data.go.kr'). */
  protected abstract getBaseUrl(): string;

  /** Default cache TTL in seconds for this adapter. */
  protected abstract getDefaultTtl(): number;

  /** Get the circuit breaker for this adapter. */
  getCircuitBreaker(): CircuitBreaker {
    return this.circuitBreaker;
  }

  /**
   * Execute a single API request through the full pipeline.
   *
   * Pipeline: validate → cache check → circuit breaker(HTTP → parse) → cache store
   */
  protected async request<T>(
    config: AdapterRequestConfig,
  ): Promise<ApiResponse<T>> {
    this.validateParams(config.params);

    const fullParams = this.buildParams(config);
    const cacheKey = CacheManager.generateKey(
      this.name,
      config.path,
      fullParams,
    );

    // Check cache
    const cached = await this.context.cache.get<ApiResponse<T>>(cacheKey);
    if (cached) {
      return { ...cached, meta: { ...cached.meta, cached: true } };
    }

    // Execute through circuit breaker
    const result = await this.circuitBreaker.execute(async () => {
      const httpResponse = await this.context.httpClient.request({
        baseUrl: this.getBaseUrl(),
        path: config.path,
        params: fullParams,
        serviceKeyParam: config.serviceKeyParam,
      });

      return this.context.parser.parse<T>(httpResponse);
    });

    // Store in cache
    const ttl = config.ttl ?? this.getDefaultTtl();
    await this.context.cache.set(cacheKey, result, ttl);

    return result;
  }

  /**
   * Fetch all pages of a paginated API response.
   *
   * Makes the initial request, determines total pages, then fetches
   * remaining pages sequentially and merges all data.
   */
  protected async requestAll<T>(
    config: AdapterRequestConfig,
  ): Promise<ApiResponse<T[]>> {
    const numOfRows = config.numOfRows ?? 100;

    // Fetch first page
    const firstPage = await this.request<T[]>({
      ...config,
      pageNo: 1,
      numOfRows,
    });

    if (!firstPage.pagination || firstPage.pagination.totalPages <= 1) {
      return firstPage;
    }

    const allData: T[] = [...firstPage.data];
    const totalPages = firstPage.pagination.totalPages;

    // Fetch remaining pages
    for (let page = 2; page <= totalPages; page++) {
      const pageResult = await this.request<T[]>({
        ...config,
        pageNo: page,
        numOfRows,
      });
      allData.push(...pageResult.data);
    }

    const pagination: PaginationInfo = {
      currentPage: 1,
      totalPages,
      totalCount: firstPage.pagination.totalCount,
      pageSize: numOfRows,
    };

    return {
      success: true,
      data: allData,
      pagination,
      meta: {
        ...firstPage.meta,
        cached: false,
      },
    };
  }

  /** Build full params including pagination parameters. */
  private buildParams(
    config: AdapterRequestConfig,
  ): Record<string, string | number | undefined> {
    const params: Record<string, string | number | undefined> = {
      ...config.params,
    };

    if (config.pageNo !== undefined) {
      params['pageNo'] = config.pageNo;
    }
    if (config.numOfRows !== undefined) {
      params['numOfRows'] = config.numOfRows;
    }

    return params;
  }

  /** Validate request parameters. */
  private validateParams(
    params?: Record<string, string | number | undefined>,
  ): void {
    if (!params) return;

    for (const [key, value] of Object.entries(params)) {
      if (value === '') {
        throw new ValidationError(`Parameter "${key}" must not be empty`, {
          field: key,
        });
      }
    }
  }
}
