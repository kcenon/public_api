import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PublicDataSDK } from '../../src/sdk.js';
import {
  NetworkError,
  ServiceUnavailableError,
  AuthenticationError,
} from '../../src/core/errors.js';

/**
 * Retry flow integration tests.
 * These test the full SDK pipeline by mocking globalThis.fetch.
 */
describe('Retry flow integration', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  function mockFetchSequence(
    responses: Array<{ status: number; body: string; headers?: HeadersInit }>,
  ) {
    let callIndex = 0;
    const mockFn = vi.fn(async () => {
      const resp = responses[callIndex] ?? responses[responses.length - 1];
      callIndex++;

      return {
        status: resp.status,
        text: async () => resp.body,
        headers: new Headers({
          'content-type': 'application/json',
          ...(resp.headers as Record<string, string>),
        }),
      } as Response;
    });

    globalThis.fetch = mockFn;
    return mockFn;
  }

  const successBody = JSON.stringify({
    response: {
      header: { resultCode: '00', resultMsg: 'NORMAL_SERVICE' },
      body: {
        items: {
          item: [
            {
              baseDate: '20240115',
              baseTime: '0500',
              category: 'TMP',
              fcstDate: '20240115',
              fcstTime: '0600',
              fcstValue: '-3',
              nx: 60,
              ny: 127,
            },
          ],
        },
        numOfRows: 10,
        pageNo: 1,
        totalCount: 1,
      },
    },
  });

  it('retries on 503 and succeeds', async () => {
    const mockFn = mockFetchSequence([
      { status: 503, body: 'Service Unavailable' },
      { status: 200, body: successBody },
    ]);

    const sdk = new PublicDataSDK({
      serviceKey: 'test-key',
      retry: { maxAttempts: 2, baseDelay: 10, maxDelay: 50 },
      cache: { enabled: false },
    });

    const result = await sdk.weather.getVilageFcst({
      baseDate: '20240115',
      baseTime: '0500',
      nx: 60,
      ny: 127,
    });

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('throws after exhausting retries', async () => {
    mockFetchSequence([
      { status: 503, body: 'Service Unavailable' },
      { status: 503, body: 'Service Unavailable' },
      { status: 503, body: 'Service Unavailable' },
    ]);

    const sdk = new PublicDataSDK({
      serviceKey: 'test-key',
      retry: { maxAttempts: 1, baseDelay: 10, maxDelay: 50 },
      cache: { enabled: false },
    });

    await expect(
      sdk.weather.getVilageFcst({
        baseDate: '20240115',
        baseTime: '0500',
        nx: 60,
        ny: 127,
      }),
    ).rejects.toThrow(ServiceUnavailableError);
  });

  it('does not retry non-retryable errors (401)', async () => {
    const mockFn = mockFetchSequence([
      { status: 401, body: 'Unauthorized' },
    ]);

    const sdk = new PublicDataSDK({
      serviceKey: 'bad-key',
      retry: { maxAttempts: 3, baseDelay: 10, maxDelay: 50 },
      cache: { enabled: false },
    });

    await expect(
      sdk.weather.getVilageFcst({
        baseDate: '20240115',
        baseTime: '0500',
        nx: 60,
        ny: 127,
      }),
    ).rejects.toThrow(AuthenticationError);

    // Should not retry — only 1 call
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('retries on network errors', async () => {
    let callCount = 0;
    globalThis.fetch = vi.fn(async () => {
      callCount++;
      if (callCount <= 1) {
        throw new Error('ECONNREFUSED');
      }
      return {
        status: 200,
        text: async () => successBody,
        headers: new Headers({ 'content-type': 'application/json' }),
      } as Response;
    });

    const sdk = new PublicDataSDK({
      serviceKey: 'test-key',
      retry: { maxAttempts: 2, baseDelay: 10, maxDelay: 50 },
      cache: { enabled: false },
    });

    const result = await sdk.weather.getVilageFcst({
      baseDate: '20240115',
      baseTime: '0500',
      nx: 60,
      ny: 127,
    });

    expect(result.success).toBe(true);
    expect(callCount).toBe(2);
  });
});

// afterEach needs to be imported
import { afterEach } from 'vitest';
