import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransportAdapter } from '../../src/adapters/transport/index.js';
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

describe('TransportAdapter', () => {
  let adapter: TransportAdapter;
  let context: AdapterContext;

  beforeEach(() => {
    context = createMockContext();
    adapter = new TransportAdapter(context);
  });

  describe('Initialization', () => {
    it('should set adapter name to "transport"', () => {
      expect(adapter.name).toBe('transport');
    });
  });

  describe('getBusArrival', () => {
    it('should return bus arrival information', async () => {
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue(
        mockParseResult([
          {
            routeno: '360',
            routeid: 'ICB165000112',
            arrtime: 300,
            arrprevstationcnt: 5,
            vehicletp: '일반버스',
            nodenm: '시청앞',
          },
          {
            routeno: 720,
            routeid: 'ICB165000234',
            arrtime: 600,
            arrprevstationcnt: 10,
            vehicletp: '저상버스',
            nodenm: '역삼역',
          },
        ]),
      );

      const result = await adapter.getBusArrival({
        cityCode: 11,
        nodeId: 'ICB165000001',
      });

      expect(result.data).toHaveLength(2);
      expect(result.data[0].routeNumber).toBe('360');
      expect(result.data[0].arrivalTime).toBe(300);
      expect(result.data[0].remainingStops).toBe(5);
      expect(result.data[0].vehicleType).toBe('일반버스');
      expect(result.data[0].currentStation).toBe('시청앞');
      expect(result.data[1].routeNumber).toBe('720');
    });

    it('should handle empty arrival list', async () => {
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue(mockParseResult([]));

      const result = await adapter.getBusArrival({
        cityCode: 11,
        nodeId: 'ICB165000001',
      });

      expect(result.data).toHaveLength(0);
    });

    it('should handle missing optional fields', async () => {
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue(
        mockParseResult([
          {
            routeno: '360',
            routeid: 'ICB165000112',
            arrtime: 300,
            arrprevstationcnt: 5,
          },
        ]),
      );

      const result = await adapter.getBusArrival({
        cityCode: 11,
        nodeId: 'ICB165000001',
      });

      expect(result.data[0].vehicleType).toBe('');
      expect(result.data[0].currentStation).toBe('');
    });
  });

  describe('searchBusStop', () => {
    it('should return bus stops matching keyword', async () => {
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue(
        mockParseResult([
          {
            nodeid: 'ICB165000001',
            nodenm: '강남역',
            gpslati: 37.498095,
            gpslong: 127.02761,
            citycode: 11,
          },
        ]),
      );

      const result = await adapter.searchBusStop({
        cityCode: 11,
        nodeName: '강남',
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].nodeId).toBe('ICB165000001');
      expect(result.data[0].nodeName).toBe('강남역');
      expect(result.data[0].latitude).toBeCloseTo(37.498095);
      expect(result.data[0].longitude).toBeCloseTo(127.02761);
      expect(result.data[0].cityCode).toBe(11);
    });
  });

  describe('getBusRoute', () => {
    it('should return bus route information', async () => {
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue(
        mockParseResult([
          {
            routeid: 'ICB165000112',
            routeno: '360',
            routetp: '간선버스',
            startnodenm: '강남역',
            endnodenm: '서울역',
            citycode: 11,
          },
        ]),
      );

      const result = await adapter.getBusRoute({
        cityCode: 11,
        routeId: 'ICB165000112',
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].routeId).toBe('ICB165000112');
      expect(result.data[0].routeNumber).toBe('360');
      expect(result.data[0].routeType).toBe('간선버스');
      expect(result.data[0].startNodeName).toBe('강남역');
      expect(result.data[0].endNodeName).toBe('서울역');
    });

    it('should handle missing optional route fields', async () => {
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue(
        mockParseResult([
          {
            routeid: 'ICB165000112',
            routeno: 360,
            citycode: 11,
          },
        ]),
      );

      const result = await adapter.getBusRoute({
        cityCode: 11,
        routeId: 'ICB165000112',
      });

      expect(result.data[0].routeType).toBe('');
      expect(result.data[0].startNodeName).toBe('');
      expect(result.data[0].endNodeName).toBe('');
    });
  });

  describe('Input validation', () => {
    it('should reject invalid city code (0)', async () => {
      await expect(
        adapter.getBusArrival({ cityCode: 0, nodeId: 'ICB165000001' }),
      ).rejects.toThrow(ValidationError);
    });

    it('should reject negative city code', async () => {
      await expect(
        adapter.getBusArrival({ cityCode: -1, nodeId: 'ICB165000001' }),
      ).rejects.toThrow(ValidationError);
    });

    it('should reject non-integer city code', async () => {
      await expect(
        adapter.getBusArrival({ cityCode: 11.5, nodeId: 'ICB165000001' }),
      ).rejects.toThrow(ValidationError);
    });

    it('should reject empty node ID', async () => {
      await expect(
        adapter.getBusArrival({ cityCode: 11, nodeId: '' }),
      ).rejects.toThrow(ValidationError);
    });

    it('should reject empty stop name', async () => {
      await expect(
        adapter.searchBusStop({ cityCode: 11, nodeName: '' }),
      ).rejects.toThrow(ValidationError);
    });

    it('should reject whitespace-only stop name', async () => {
      await expect(
        adapter.searchBusStop({ cityCode: 11, nodeName: '   ' }),
      ).rejects.toThrow(ValidationError);
    });

    it('should reject empty route ID', async () => {
      await expect(
        adapter.getBusRoute({ cityCode: 11, routeId: '' }),
      ).rejects.toThrow(ValidationError);
    });

    it('should validate city code for searchBusStop', async () => {
      await expect(
        adapter.searchBusStop({ cityCode: 0, nodeName: '강남' }),
      ).rejects.toThrow(ValidationError);
    });

    it('should validate city code for getBusRoute', async () => {
      await expect(
        adapter.getBusRoute({ cityCode: -5, routeId: 'ICB165000112' }),
      ).rejects.toThrow(ValidationError);
    });
  });
});
