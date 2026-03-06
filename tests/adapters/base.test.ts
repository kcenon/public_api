import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BaseAdapter } from '../../src/adapters/base.js';
import type { AdapterContext } from '../../src/types/adapter.js';
import type { ApiResponse } from '../../src/types/common.js';
import { CircuitOpenError, ValidationError } from '../../src/core/errors.js';
import { CircuitBreaker } from '../../src/core/circuit-breaker.js';

/** Concrete test adapter extending BaseAdapter. */
class TestAdapter extends BaseAdapter {
  protected getAdapterName(): string {
    return 'test';
  }

  protected getBaseUrl(): string {
    return 'apis.data.go.kr';
  }

  protected getDefaultTtl(): number {
    return 3600;
  }

  /** Expose protected request method for testing. */
  async testRequest<T>(
    config: Parameters<BaseAdapter['request']>[0],
  ): Promise<ApiResponse<T>> {
    return this.request<T>(config);
  }

  /** Expose protected requestAll method for testing. */
  async testRequestAll<T>(
    config: Parameters<BaseAdapter['request']>[0],
  ): Promise<ApiResponse<T[]>> {
    return this.requestAll<T>(config);
  }
}

function createMockContext(
  overrides: Partial<AdapterContext> = {},
): AdapterContext {
  return {
    config: {
      serviceKey: 'test-key',
      timeout: 30000,
      cache: { enabled: true, ttl: 3600, maxEntries: 1000 },
      retry: {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 30000,
        retryableStatusCodes: [500, 502, 503, 504],
      },
      circuitBreaker: {
        failureThreshold: 5,
        resetTimeout: 30000,
        halfOpenMaxAttempts: 1,
      },
    },
    httpClient: {
      request: vi.fn(),
    } as unknown as AdapterContext['httpClient'],
    cache: {
      get: vi.fn().mockResolvedValue(undefined),
      set: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(true),
      has: vi.fn().mockResolvedValue(false),
    } as unknown as AdapterContext['cache'],
    parser: {
      parse: vi.fn(),
    } as unknown as AdapterContext['parser'],
    ...overrides,
  };
}

function createApiResponse<T>(data: T, pagination?: ApiResponse<T>['pagination']): ApiResponse<T> {
  return {
    success: true,
    data,
    pagination,
    meta: {
      cached: false,
      timestamp: new Date(),
      responseTime: 100,
    },
  };
}

describe('BaseAdapter', () => {
  let adapter: TestAdapter;
  let context: AdapterContext;

  beforeEach(() => {
    context = createMockContext();
    adapter = new TestAdapter(context);
  });

  describe('Initialization', () => {
    it('should set adapter name from getAdapterName()', () => {
      expect(adapter.name).toBe('test');
    });

    it('should create a circuit breaker', () => {
      expect(adapter.getCircuitBreaker()).toBeInstanceOf(CircuitBreaker);
    });

    it('should use circuit breaker config from context', () => {
      const breaker = adapter.getCircuitBreaker();
      expect(breaker.adapterName).toBe('test');
    });
  });

  describe('request() pipeline', () => {
    it('should return cached response on cache hit', async () => {
      const cachedResponse = createApiResponse({ id: 1 });
      vi.mocked(context.cache.get).mockResolvedValue(cachedResponse);

      const result = await adapter.testRequest({ path: '/test' });

      expect(result.data).toEqual({ id: 1 });
      expect(result.meta.cached).toBe(true);
      expect(context.httpClient.request).not.toHaveBeenCalled();
    });

    it('should make HTTP request on cache miss', async () => {
      const httpResponse = {
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: '{"data": "test"}',
        responseTime: 150,
      };
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue(
        createApiResponse('test'),
      );

      const result = await adapter.testRequest({ path: '/test' });

      expect(context.httpClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          baseUrl: 'apis.data.go.kr',
          path: '/test',
        }),
      );
      expect(result.success).toBe(true);
    });

    it('should parse HTTP response', async () => {
      const httpResponse = {
        status: 200,
        headers: {},
        body: '{}',
        responseTime: 100,
      };
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue(
        createApiResponse('parsed'),
      );

      await adapter.testRequest({ path: '/test' });

      expect(context.parser.parse).toHaveBeenCalledWith(httpResponse);
    });

    it('should store result in cache after successful request', async () => {
      const httpResponse = {
        status: 200,
        headers: {},
        body: '{}',
        responseTime: 100,
      };
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      const apiResponse = createApiResponse('test');
      vi.mocked(context.parser.parse).mockReturnValue(apiResponse);

      await adapter.testRequest({ path: '/test' });

      expect(context.cache.set).toHaveBeenCalledWith(
        expect.any(String),
        apiResponse,
        3600,
      );
    });

    it('should use custom TTL when provided', async () => {
      const httpResponse = {
        status: 200,
        headers: {},
        body: '{}',
        responseTime: 100,
      };
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue(
        createApiResponse('test'),
      );

      await adapter.testRequest({ path: '/test', ttl: 600 });

      expect(context.cache.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.anything(),
        600,
      );
    });

    it('should pass params to HTTP client', async () => {
      const httpResponse = {
        status: 200,
        headers: {},
        body: '{}',
        responseTime: 100,
      };
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue(
        createApiResponse('test'),
      );

      await adapter.testRequest({
        path: '/test',
        params: { city: 'Seoul', type: 'forecast' },
      });

      expect(context.httpClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            city: 'Seoul',
            type: 'forecast',
          }),
        }),
      );
    });

    it('should pass serviceKeyParam to HTTP client', async () => {
      const httpResponse = {
        status: 200,
        headers: {},
        body: '{}',
        responseTime: 100,
      };
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue(
        createApiResponse('test'),
      );

      await adapter.testRequest({
        path: '/test',
        serviceKeyParam: 'confmKey',
      });

      expect(context.httpClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          serviceKeyParam: 'confmKey',
        }),
      );
    });
  });

  describe('Circuit breaker integration', () => {
    it('should throw CircuitOpenError when circuit is open', async () => {
      const breaker = adapter.getCircuitBreaker();
      // Trip the circuit breaker
      for (let i = 0; i < 5; i++) {
        vi.mocked(context.httpClient.request).mockRejectedValueOnce(
          new Error('fail'),
        );
        await adapter.testRequest({ path: '/test' }).catch(() => {});
      }

      expect(breaker.getState()).toBe('OPEN');
      await expect(
        adapter.testRequest({ path: '/test' }),
      ).rejects.toThrow(CircuitOpenError);
    });
  });

  describe('Parameter validation', () => {
    it('should reject empty string parameters', async () => {
      await expect(
        adapter.testRequest({
          path: '/test',
          params: { city: '' },
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('should accept undefined parameter values', async () => {
      const httpResponse = {
        status: 200,
        headers: {},
        body: '{}',
        responseTime: 100,
      };
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue(
        createApiResponse('test'),
      );

      await expect(
        adapter.testRequest({
          path: '/test',
          params: { city: 'Seoul', extra: undefined },
        }),
      ).resolves.toBeDefined();
    });
  });

  describe('requestAll() pagination', () => {
    it('should return single page when totalPages <= 1', async () => {
      const httpResponse = {
        status: 200,
        headers: {},
        body: '{}',
        responseTime: 100,
      };
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue(
        createApiResponse(['item1', 'item2'], {
          currentPage: 1,
          totalPages: 1,
          totalCount: 2,
          pageSize: 100,
        }),
      );

      const result = await adapter.testRequestAll({ path: '/test' });

      expect(result.data).toEqual(['item1', 'item2']);
      expect(context.httpClient.request).toHaveBeenCalledTimes(1);
    });

    it('should fetch all pages and merge data', async () => {
      const httpResponse = {
        status: 200,
        headers: {},
        body: '{}',
        responseTime: 100,
      };
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);

      // First page
      vi.mocked(context.parser.parse)
        .mockReturnValueOnce(
          createApiResponse(['item1', 'item2'], {
            currentPage: 1,
            totalPages: 3,
            totalCount: 5,
            pageSize: 2,
          }),
        )
        // Second page
        .mockReturnValueOnce(
          createApiResponse(['item3', 'item4'], {
            currentPage: 2,
            totalPages: 3,
            totalCount: 5,
            pageSize: 2,
          }),
        )
        // Third page
        .mockReturnValueOnce(
          createApiResponse(['item5'], {
            currentPage: 3,
            totalPages: 3,
            totalCount: 5,
            pageSize: 2,
          }),
        );

      const result = await adapter.testRequestAll({
        path: '/test',
        numOfRows: 2,
      });

      expect(result.data).toEqual(['item1', 'item2', 'item3', 'item4', 'item5']);
      expect(result.pagination?.totalCount).toBe(5);
      expect(result.pagination?.totalPages).toBe(3);
      expect(context.httpClient.request).toHaveBeenCalledTimes(3);
    });

    it('should return empty array when no pagination info', async () => {
      const httpResponse = {
        status: 200,
        headers: {},
        body: '{}',
        responseTime: 100,
      };
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue(
        createApiResponse([]),
      );

      const result = await adapter.testRequestAll({ path: '/test' });

      expect(result.data).toEqual([]);
    });
  });

  describe('Cache key generation', () => {
    it('should generate unique cache keys for different params', async () => {
      const httpResponse = {
        status: 200,
        headers: {},
        body: '{}',
        responseTime: 100,
      };
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue(
        createApiResponse('test'),
      );

      await adapter.testRequest({
        path: '/test',
        params: { city: 'Seoul' },
      });
      await adapter.testRequest({
        path: '/test',
        params: { city: 'Busan' },
      });

      const cacheSetCalls = vi.mocked(context.cache.set).mock.calls;
      expect(cacheSetCalls[0][0]).not.toBe(cacheSetCalls[1][0]);
    });

    it('should generate same cache key for same params', async () => {
      vi.mocked(context.cache.get)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      const httpResponse = {
        status: 200,
        headers: {},
        body: '{}',
        responseTime: 100,
      };
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue(
        createApiResponse('test'),
      );

      await adapter.testRequest({
        path: '/test',
        params: { city: 'Seoul' },
      });
      await adapter.testRequest({
        path: '/test',
        params: { city: 'Seoul' },
      });

      const cacheSetCalls = vi.mocked(context.cache.set).mock.calls;
      expect(cacheSetCalls[0][0]).toBe(cacheSetCalls[1][0]);
    });
  });
});
