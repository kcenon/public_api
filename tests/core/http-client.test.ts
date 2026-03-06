import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HttpClient, type HttpClientConfig } from '../../src/core/http-client.js';
import {
  NetworkError,
  AuthenticationError,
  RateLimitError,
  ServiceUnavailableError,
} from '../../src/core/errors.js';

const defaultConfig: HttpClientConfig = {
  serviceKey: 'test-key-123',
  timeout: 5000,
  retry: {
    maxAttempts: 2,
    baseDelay: 10, // short for tests
    maxDelay: 100,
    retryableStatusCodes: [500, 502, 503, 504],
  },
};

function mockFetch(
  responses: Array<{ status: number; body: string; headers?: Record<string, string> }>,
) {
  let callIndex = 0;
  return vi.fn(async () => {
    const resp = responses[callIndex] ?? responses[responses.length - 1];
    callIndex++;
    return {
      status: resp.status,
      text: async () => resp.body,
      headers: new Map(Object.entries(resp.headers ?? { 'content-type': 'application/json' })),
    } as unknown as Response;
  });
}

describe('HttpClient', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('Successful requests', () => {
    it('should execute a GET request and return response', async () => {
      globalThis.fetch = mockFetch([{ status: 200, body: '{"data":"ok"}' }]);
      const client = new HttpClient(defaultConfig);

      const result = await client.request({
        baseUrl: 'apis.data.go.kr',
        path: '/test/api',
        params: { type: 'json' },
      });

      expect(result.status).toBe(200);
      expect(result.body).toBe('{"data":"ok"}');
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
      expect(globalThis.fetch).toHaveBeenCalledOnce();
    });

    it('should execute a POST request with body', async () => {
      globalThis.fetch = mockFetch([{ status: 200, body: '{}' }]);
      const client = new HttpClient(defaultConfig);

      await client.request({
        baseUrl: 'api.odcloud.kr',
        path: '/api/test',
        method: 'POST',
        body: { key: 'value' },
      });

      const fetchCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const url = fetchCall[0] as string;
      const options = fetchCall[1] as RequestInit;

      expect(url).toContain('https://api.odcloud.kr/api/test');
      expect(options.method).toBe('POST');
      expect(options.body).toBe('{"key":"value"}');
    });

    it('should inject service key as query parameter', async () => {
      globalThis.fetch = mockFetch([{ status: 200, body: '{}' }]);
      const client = new HttpClient(defaultConfig);

      await client.request({
        baseUrl: 'apis.data.go.kr',
        path: '/test',
      });

      const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(url).toContain('serviceKey=test-key-123');
    });

    it('should use custom service key parameter name', async () => {
      globalThis.fetch = mockFetch([{ status: 200, body: '{}' }]);
      const client = new HttpClient(defaultConfig);

      await client.request({
        baseUrl: 'juso.go.kr',
        path: '/test',
        serviceKeyParam: 'confmKey',
      });

      const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(url).toContain('confmKey=test-key-123');
      expect(url).not.toContain('serviceKey=');
    });

    it('should set User-Agent header', async () => {
      globalThis.fetch = mockFetch([{ status: 200, body: '{}' }]);
      const client = new HttpClient(defaultConfig);

      await client.request({
        baseUrl: 'apis.data.go.kr',
        path: '/test',
      });

      const options = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1] as RequestInit;
      expect((options.headers as Record<string, string>)['User-Agent']).toMatch(
        /^public-data-sdk\//,
      );
    });
  });

  describe('Error handling', () => {
    it('should throw AuthenticationError on 401', async () => {
      globalThis.fetch = mockFetch([{ status: 401, body: 'Unauthorized' }]);
      const client = new HttpClient(defaultConfig);

      await expect(
        client.request({ baseUrl: 'x', path: '/test' }),
      ).rejects.toThrow(AuthenticationError);
    });

    it('should throw RateLimitError on 429', async () => {
      globalThis.fetch = mockFetch([{ status: 429, body: 'Too many' }]);
      const client = new HttpClient(defaultConfig);

      await expect(
        client.request({ baseUrl: 'x', path: '/test' }),
      ).rejects.toThrow(RateLimitError);
    });

    it('should throw NetworkError on timeout', async () => {
      globalThis.fetch = vi.fn(
        () => new Promise((_, reject) => {
          setTimeout(() => reject(new DOMException('', 'AbortError')), 10);
        }),
      );
      const client = new HttpClient({ ...defaultConfig, timeout: 1 });

      await expect(
        client.request({ baseUrl: 'x', path: '/test' }),
      ).rejects.toThrow(NetworkError);
    });

    it('should throw NetworkError on network failure', async () => {
      globalThis.fetch = vi.fn(async () => {
        throw new Error('ECONNREFUSED');
      });
      const client = new HttpClient(defaultConfig);

      await expect(
        client.request({ baseUrl: 'x', path: '/test' }),
      ).rejects.toThrow(NetworkError);
    });
  });

  describe('Retry logic', () => {
    it('should retry on 500 error and succeed on recovery', async () => {
      globalThis.fetch = mockFetch([
        { status: 500, body: 'Internal Server Error' },
        { status: 200, body: '{"ok":true}' },
      ]);
      const client = new HttpClient(defaultConfig);

      const result = await client.request({
        baseUrl: 'x',
        path: '/test',
      });

      expect(result.status).toBe(200);
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    });

    it('should retry on network errors', async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn(async () => {
        callCount++;
        if (callCount === 1) throw new Error('ECONNRESET');
        return {
          status: 200,
          text: async () => '{}',
          headers: new Map(),
        } as unknown as Response;
      });
      const client = new HttpClient(defaultConfig);

      const result = await client.request({
        baseUrl: 'x',
        path: '/test',
      });

      expect(result.status).toBe(200);
      expect(callCount).toBe(2);
    });

    it('should not retry on 401', async () => {
      globalThis.fetch = mockFetch([
        { status: 401, body: 'Unauthorized' },
        { status: 200, body: '{}' },
      ]);
      const client = new HttpClient(defaultConfig);

      await expect(
        client.request({ baseUrl: 'x', path: '/test' }),
      ).rejects.toThrow(AuthenticationError);
      expect(globalThis.fetch).toHaveBeenCalledOnce();
    });

    it('should exhaust retries and throw last error', async () => {
      globalThis.fetch = mockFetch([
        { status: 503, body: 'Unavailable' },
        { status: 503, body: 'Unavailable' },
        { status: 503, body: 'Unavailable' },
      ]);
      const client = new HttpClient(defaultConfig);

      await expect(
        client.request({ baseUrl: 'x', path: '/test' }),
      ).rejects.toThrow(ServiceUnavailableError);
      // 1 initial + 2 retries = 3
      expect(globalThis.fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('URL building', () => {
    it('should build correct URL with params', async () => {
      globalThis.fetch = mockFetch([{ status: 200, body: '{}' }]);
      const client = new HttpClient(defaultConfig);

      await client.request({
        baseUrl: 'apis.data.go.kr/1360000',
        path: '/VilageFcstInfoService_2.0/getVilageFcst',
        params: {
          numOfRows: 10,
          pageNo: 1,
          dataType: 'JSON',
          base_date: '20260306',
          nx: undefined, // should be skipped
        },
      });

      const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(url).toContain('numOfRows=10');
      expect(url).toContain('pageNo=1');
      expect(url).toContain('dataType=JSON');
      expect(url).not.toContain('nx=');
    });
  });
});
