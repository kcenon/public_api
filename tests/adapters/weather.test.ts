import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WeatherAdapter } from '../../src/adapters/weather/index.js';
import {
  latLngToGrid,
  getCategoryName,
  getValueDescription,
} from '../../src/adapters/weather/utils.js';
import type { AdapterContext } from '../../src/types/adapter.js';
import { ValidationError } from '../../src/core/errors.js';

function createMockContext(): AdapterContext {
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
  };
}

describe('WeatherAdapter', () => {
  let adapter: WeatherAdapter;
  let context: AdapterContext;

  beforeEach(() => {
    context = createMockContext();
    adapter = new WeatherAdapter(context);
  });

  describe('Initialization', () => {
    it('should set adapter name to "weather"', () => {
      expect(adapter.name).toBe('weather');
    });
  });

  describe('getVilageFcst', () => {
    it('should call request with correct params', async () => {
      const httpResponse = {
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: '{}',
        responseTime: 100,
      };
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue({
        success: true,
        data: [
          {
            baseDate: '20260306',
            baseTime: '0500',
            category: 'TMP',
            fcstDate: '20260306',
            fcstTime: '0600',
            fcstValue: '-1',
            nx: 60,
            ny: 127,
          },
        ],
        meta: { cached: false, timestamp: new Date(), responseTime: 100 },
      });

      const result = await adapter.getVilageFcst({
        baseDate: '20260306',
        baseTime: '0500',
        nx: 60,
        ny: 127,
      });

      expect(result.success).toBe(true);
      expect(result.data[0].category).toBe('TMP');
      expect(result.data[0].categoryName).toBe('1시간 기온');
      expect(result.data[0].fcstValue).toBe('-1');
    });

    it('should auto-convert lat/lng to grid coordinates', async () => {
      const httpResponse = {
        status: 200,
        headers: {},
        body: '{}',
        responseTime: 100,
      };
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue({
        success: true,
        data: [],
        meta: { cached: false, timestamp: new Date(), responseTime: 100 },
      });

      await adapter.getVilageFcst({
        baseDate: '20260306',
        baseTime: '0500',
        lat: 37.5665,
        lng: 126.978,
      });

      expect(context.httpClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            nx: expect.any(Number),
            ny: expect.any(Number),
          }),
        }),
      );
    });
  });

  describe('getUltraSrtNcst', () => {
    it('should return observation data with category names', async () => {
      const httpResponse = {
        status: 200,
        headers: {},
        body: '{}',
        responseTime: 100,
      };
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue({
        success: true,
        data: [
          {
            baseDate: '20260306',
            baseTime: '1400',
            category: 'T1H',
            obsrValue: '5.2',
            nx: 60,
            ny: 127,
          },
        ],
        meta: { cached: false, timestamp: new Date(), responseTime: 100 },
      });

      const result = await adapter.getUltraSrtNcst({
        baseDate: '20260306',
        baseTime: '1400',
        nx: 60,
        ny: 127,
      });

      expect(result.data[0].category).toBe('T1H');
      expect(result.data[0].categoryName).toBe('기온');
      expect(result.data[0].obsrValue).toBe('5.2');
    });
  });

  describe('getUltraSrtFcst', () => {
    it('should return forecast data', async () => {
      const httpResponse = {
        status: 200,
        headers: {},
        body: '{}',
        responseTime: 100,
      };
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue({
        success: true,
        data: [
          {
            baseDate: '20260306',
            baseTime: '1430',
            category: 'SKY',
            fcstDate: '20260306',
            fcstTime: '1500',
            fcstValue: '1',
            nx: 60,
            ny: 127,
          },
        ],
        meta: { cached: false, timestamp: new Date(), responseTime: 100 },
      });

      const result = await adapter.getUltraSrtFcst({
        baseDate: '20260306',
        baseTime: '1430',
        nx: 60,
        ny: 127,
      });

      expect(result.data[0].category).toBe('SKY');
      expect(result.data[0].categoryName).toBe('하늘상태');
    });
  });

  describe('Input validation', () => {
    it('should reject invalid baseDate format', async () => {
      await expect(
        adapter.getVilageFcst({
          baseDate: '2026-03-06',
          baseTime: '0500',
          nx: 60,
          ny: 127,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('should reject invalid baseTime format', async () => {
      await expect(
        adapter.getVilageFcst({
          baseDate: '20260306',
          baseTime: '5:00',
          nx: 60,
          ny: 127,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('should reject nx out of range', async () => {
      await expect(
        adapter.getVilageFcst({
          baseDate: '20260306',
          baseTime: '0500',
          nx: 0,
          ny: 127,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('should reject ny out of range', async () => {
      await expect(
        adapter.getVilageFcst({
          baseDate: '20260306',
          baseTime: '0500',
          nx: 60,
          ny: 1000,
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('should require either nx/ny or lat/lng', async () => {
      await expect(
        adapter.getVilageFcst({
          baseDate: '20260306',
          baseTime: '0500',
        }),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('Response caching', () => {
    it('should return cached response on cache hit', async () => {
      const cachedResponse = {
        success: true,
        data: [
          {
            baseDate: '20260306',
            baseTime: '0500',
            category: 'TMP',
            categoryName: '1시간 기온',
            fcstDate: '20260306',
            fcstTime: '0600',
            fcstValue: '5',
            nx: 60,
            ny: 127,
          },
        ],
        meta: { cached: false, timestamp: new Date(), responseTime: 100 },
      };
      vi.mocked(context.cache.get).mockResolvedValue(cachedResponse);

      const result = await adapter.getVilageFcst({
        baseDate: '20260306',
        baseTime: '0500',
        nx: 60,
        ny: 127,
      });

      expect(result.meta.cached).toBe(true);
      expect(context.httpClient.request).not.toHaveBeenCalled();
    });
  });
});

describe('Weather utilities', () => {
  describe('latLngToGrid', () => {
    it('should convert Seoul coordinates to grid', () => {
      const grid = latLngToGrid(37.5665, 126.978);
      expect(grid.nx).toBe(60);
      expect(grid.ny).toBe(127);
    });

    it('should convert Busan coordinates to grid', () => {
      const grid = latLngToGrid(35.1796, 129.0756);
      expect(grid.nx).toBe(98);
      expect(grid.ny).toBe(76);
    });

    it('should convert Jeju coordinates to grid', () => {
      const grid = latLngToGrid(33.4996, 126.5312);
      expect(grid.nx).toBe(53);
      expect(grid.ny).toBe(38);
    });
  });

  describe('getCategoryName', () => {
    it('should return Korean name for TMP', () => {
      expect(getCategoryName('TMP')).toBe('1시간 기온');
    });

    it('should return English name for POP', () => {
      expect(getCategoryName('POP', 'en')).toBe('Precipitation Probability');
    });

    it('should return code for unknown category', () => {
      expect(getCategoryName('UNKNOWN')).toBe('UNKNOWN');
    });
  });

  describe('getValueDescription', () => {
    it('should describe PTY values', () => {
      expect(getValueDescription('PTY', '1')).toBe('비');
      expect(getValueDescription('PTY', '1', 'en')).toBe('Rain');
      expect(getValueDescription('PTY', '3')).toBe('눈');
    });

    it('should describe SKY values', () => {
      expect(getValueDescription('SKY', '1')).toBe('맑음');
      expect(getValueDescription('SKY', '1', 'en')).toBe('Clear');
      expect(getValueDescription('SKY', '4')).toBe('흐림');
    });

    it('should return undefined for non-mapped categories', () => {
      expect(getValueDescription('TMP', '5')).toBeUndefined();
    });
  });
});
