import {
  NetworkError,
  ServiceUnavailableError,
  AuthenticationError,
  RateLimitError,
} from './errors.js';
import type { RetryConfig } from '../types/config.js';

const SDK_VERSION = '0.0.1';

export interface HttpClientConfig {
  serviceKey: string;
  timeout: number;
  retry: Required<RetryConfig>;
}

export interface RequestConfig {
  baseUrl: string;
  path: string;
  method?: 'GET' | 'POST';
  params?: Record<string, string | number | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
  /** Override service key injection (e.g., for APIs using confmKey). */
  serviceKeyParam?: string;
}

export interface RawHttpResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
  responseTime: number;
}

export class HttpClient {
  private readonly config: HttpClientConfig;

  constructor(config: HttpClientConfig) {
    this.config = config;
  }

  async request(requestConfig: RequestConfig): Promise<RawHttpResponse> {
    const { retry } = this.config;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retry.maxAttempts; attempt++) {
      try {
        const response = await this.executeRequest(requestConfig);

        if (response.status === 401) {
          throw new AuthenticationError(
            'Invalid or expired service key',
            response,
          );
        }

        if (response.status === 429) {
          throw new RateLimitError('API rate limit exceeded', {
            originalError: response,
          });
        }

        if (
          response.status >= 500 &&
          retry.retryableStatusCodes.includes(response.status)
        ) {
          throw new ServiceUnavailableError(
            `API returned ${response.status}`,
            response,
          );
        }

        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        const isRetryable =
          error instanceof NetworkError ||
          error instanceof ServiceUnavailableError ||
          error instanceof RateLimitError;

        if (!isRetryable || attempt >= retry.maxAttempts) {
          throw lastError;
        }

        const delay = this.calculateDelay(attempt, retry);
        await this.sleep(delay);
      }
    }

    throw lastError ?? new NetworkError('Request failed after retries');
  }

  private async executeRequest(
    config: RequestConfig,
  ): Promise<RawHttpResponse> {
    const url = this.buildUrl(config);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    const startTime = Date.now();

    try {
      const fetchOptions: RequestInit = {
        method: config.method ?? 'GET',
        headers: {
          'User-Agent': `public-data-sdk/${SDK_VERSION}`,
          ...config.headers,
        },
        signal: controller.signal,
      };

      if (config.body && config.method === 'POST') {
        fetchOptions.body = JSON.stringify(config.body);
        (fetchOptions.headers as Record<string, string>)['Content-Type'] =
          'application/json';
      }

      const response = await fetch(url, fetchOptions);
      const body = await response.text();
      const responseTime = Date.now() - startTime;

      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      return {
        status: response.status,
        headers,
        body,
        responseTime,
      };
    } catch (error) {
      if (error instanceof AuthenticationError) throw error;
      if (error instanceof RateLimitError) throw error;
      if (error instanceof ServiceUnavailableError) throw error;

      const isAbort =
        error instanceof DOMException && error.name === 'AbortError';
      if (isAbort) {
        throw new NetworkError(
          `Request timed out after ${this.config.timeout}ms`,
          error,
        );
      }

      throw new NetworkError(
        `Network request failed: ${error instanceof Error ? error.message : String(error)}`,
        error,
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private buildUrl(config: RequestConfig): string {
    const base = config.baseUrl.replace(/\/$/, '');
    const path = config.path.startsWith('/') ? config.path : `/${config.path}`;
    const url = new URL(`https://${base}${path}`);

    // Inject service key
    const keyParam = config.serviceKeyParam ?? 'serviceKey';
    url.searchParams.set(keyParam, this.config.serviceKey);

    // Add other query parameters
    if (config.params) {
      for (const [key, value] of Object.entries(config.params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    return url.toString();
  }

  private calculateDelay(
    attempt: number,
    retry: Required<RetryConfig>,
  ): number {
    const exponentialDelay = retry.baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * retry.baseDelay;
    return Math.min(exponentialDelay + jitter, retry.maxDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
