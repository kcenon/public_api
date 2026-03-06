import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AirQualityAdapter } from '../../src/adapters/air-quality/index.js';
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

function mockParseResult(items: unknown[]) {
  return {
    success: true,
    data: items,
    meta: { cached: false, timestamp: new Date(), responseTime: 100 },
  };
}

const httpResponse = {
  status: 200,
  headers: { 'content-type': 'application/json' },
  body: '{}',
  responseTime: 100,
};

const sampleAirQualityItem = {
  stationName: '종로구',
  dataTime: '2024-01-15 14:00',
  pm10Value: '45',
  pm25Value: '22',
  o3Value: '0.035',
  no2Value: '0.028',
  coValue: '0.5',
  so2Value: '0.003',
  khaiValue: '72',
  khaiGrade: '2',
  pm10Grade: '1',
  pm25Grade: '2',
};

describe('AirQualityAdapter', () => {
  let adapter: AirQualityAdapter;
  let context: AdapterContext;

  beforeEach(() => {
    context = createMockContext();
    adapter = new AirQualityAdapter(context);
  });

  describe('Initialization', () => {
    it('should set adapter name to "air-quality"', () => {
      expect(adapter.name).toBe('air-quality');
    });
  });

  describe('getByStation', () => {
    it('should return air quality data by station', async () => {
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue(
        mockParseResult([sampleAirQualityItem]),
      );

      const result = await adapter.getByStation({
        stationName: '종로구',
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].stationName).toBe('종로구');
      expect(result.data[0].pm10Value).toBe(45);
      expect(result.data[0].pm25Value).toBe(22);
      expect(result.data[0].o3Value).toBeCloseTo(0.035);
      expect(result.data[0].khaiValue).toBe(72);
      expect(result.data[0].khaiGrade).toBe('MODERATE');
      expect(result.data[0].pm10Grade).toBe('GOOD');
      expect(result.data[0].pm25Grade).toBe('MODERATE');
    });

    it('should handle null measurement values', async () => {
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue(
        mockParseResult([
          {
            ...sampleAirQualityItem,
            pm10Value: '-',
            pm25Value: '',
            o3Value: '-',
          },
        ]),
      );

      const result = await adapter.getByStation({
        stationName: '종로구',
      });

      expect(result.data[0].pm10Value).toBeNull();
      expect(result.data[0].pm25Value).toBeNull();
      expect(result.data[0].o3Value).toBeNull();
    });

    it('should pass dataTerm parameter', async () => {
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue(mockParseResult([]));

      await adapter.getByStation({
        stationName: '종로구',
        dataTerm: 'MONTH',
      });

      expect(context.httpClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            dataTerm: 'MONTH',
          }),
        }),
      );
    });
  });

  describe('getByRegion', () => {
    it('should return air quality data for region', async () => {
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue(
        mockParseResult([
          { ...sampleAirQualityItem, stationName: '종로구' },
          { ...sampleAirQualityItem, stationName: '중구' },
        ]),
      );

      const result = await adapter.getByRegion({ sidoName: '서울' });

      expect(result.data).toHaveLength(2);
      expect(result.data[0].stationName).toBe('종로구');
      expect(result.data[1].stationName).toBe('중구');
    });
  });

  describe('getNearbyStation', () => {
    it('should return nearby stations sorted by distance', async () => {
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue(
        mockParseResult([
          {
            stationName: '종로구',
            addr: '서울 종로구 종로35가길 19',
            tm: 0.5,
          },
          {
            stationName: '중구',
            addr: '서울 중구 덕수궁길 15',
            tm: 1.2,
          },
        ]),
      );

      const result = await adapter.getNearbyStation({
        tmX: 244148.5,
        tmY: 412423.2,
      });

      expect(result.data).toHaveLength(2);
      expect(result.data[0].stationName).toBe('종로구');
      expect(result.data[0].tm).toBe(0.5);
      expect(result.data[1].stationName).toBe('중구');
    });
  });

  describe('interpretGrade', () => {
    it('should map grade 1 to GOOD', () => {
      expect(AirQualityAdapter.interpretGrade('1')).toBe('GOOD');
    });

    it('should map grade 2 to MODERATE', () => {
      expect(AirQualityAdapter.interpretGrade('2')).toBe('MODERATE');
    });

    it('should map grade 3 to UNHEALTHY_SENSITIVE', () => {
      expect(AirQualityAdapter.interpretGrade('3')).toBe('UNHEALTHY_SENSITIVE');
    });

    it('should map grade 4 to UNHEALTHY', () => {
      expect(AirQualityAdapter.interpretGrade('4')).toBe('UNHEALTHY');
    });

    it('should return UNKNOWN for unrecognized grade', () => {
      expect(AirQualityAdapter.interpretGrade('99')).toBe('UNKNOWN');
    });
  });

  describe('Input validation', () => {
    it('should reject empty station name', async () => {
      await expect(adapter.getByStation({ stationName: '' })).rejects.toThrow(
        ValidationError,
      );
    });

    it('should reject whitespace-only station name', async () => {
      await expect(
        adapter.getByStation({ stationName: '   ' }),
      ).rejects.toThrow(ValidationError);
    });

    it('should reject empty region name', async () => {
      await expect(adapter.getByRegion({ sidoName: '' })).rejects.toThrow(
        ValidationError,
      );
    });

    it('should reject NaN tmX', async () => {
      await expect(
        adapter.getNearbyStation({ tmX: NaN, tmY: 412423.2 }),
      ).rejects.toThrow(ValidationError);
    });

    it('should reject NaN tmY', async () => {
      await expect(
        adapter.getNearbyStation({ tmX: 244148.5, tmY: NaN }),
      ).rejects.toThrow(ValidationError);
    });
  });
});
