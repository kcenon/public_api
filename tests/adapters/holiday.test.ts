import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HolidayAdapter } from '../../src/adapters/holiday/index.js';
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

describe('HolidayAdapter', () => {
  let adapter: HolidayAdapter;
  let context: AdapterContext;

  beforeEach(() => {
    context = createMockContext();
    adapter = new HolidayAdapter(context);
  });

  describe('Initialization', () => {
    it('should set adapter name to "holiday"', () => {
      expect(adapter.name).toBe('holiday');
    });
  });

  describe('getHolidays', () => {
    it('should return public holidays for a year', async () => {
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue(
        mockParseResult([
          {
            dateKind: '01',
            dateName: '신정',
            isHoliday: 'Y',
            locdate: 20240101,
            seq: 1,
          },
          {
            dateKind: '01',
            dateName: '삼일절',
            isHoliday: 'Y',
            locdate: 20240301,
            seq: 1,
          },
        ]),
      );

      const result = await adapter.getHolidays({ year: 2024 });

      expect(result.data).toHaveLength(2);
      expect(result.data[0].date).toBe('20240101');
      expect(result.data[0].name).toBe('신정');
      expect(result.data[0].isHoliday).toBe(true);
      expect(result.data[0].kind).toBe('public_holiday');
    });

    it('should query by year and month', async () => {
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue(
        mockParseResult([
          {
            dateKind: '01',
            dateName: '신정',
            isHoliday: 'Y',
            locdate: 20240101,
            seq: 1,
          },
        ]),
      );

      await adapter.getHolidays({ year: 2024, month: 1 });

      expect(context.httpClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            solYear: 2024,
            solMonth: '01',
          }),
        }),
      );
    });

    it('should zero-pad month parameter', async () => {
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue(mockParseResult([]));

      await adapter.getHolidays({ year: 2024, month: 3 });

      expect(context.httpClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            solMonth: '03',
          }),
        }),
      );
    });

    it('should handle non-holiday items', async () => {
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue(
        mockParseResult([
          {
            dateKind: '01',
            dateName: '식목일',
            isHoliday: 'N',
            locdate: 20240405,
            seq: 1,
          },
        ]),
      );

      const result = await adapter.getHolidays({ year: 2024 });

      expect(result.data[0].isHoliday).toBe(false);
    });
  });

  describe('getNationalDays', () => {
    it('should return national days', async () => {
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue(
        mockParseResult([
          {
            dateKind: '02',
            dateName: '한글날',
            isHoliday: 'Y',
            locdate: 20241009,
            seq: 1,
          },
        ]),
      );

      const result = await adapter.getNationalDays({ year: 2024, month: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('한글날');
      expect(result.data[0].kind).toBe('national_day');
    });
  });

  describe('getSolarTerms', () => {
    it('should return solar terms', async () => {
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue(
        mockParseResult([
          {
            dateKind: '24',
            dateName: '소한',
            isHoliday: 'N',
            locdate: 20240106,
            seq: 1,
          },
          {
            dateKind: '24',
            dateName: '대한',
            isHoliday: 'N',
            locdate: 20240120,
            seq: 1,
          },
        ]),
      );

      const result = await adapter.getSolarTerms({ year: 2024 });

      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe('소한');
      expect(result.data[0].kind).toBe('solar_term');
      expect(result.data[0].isHoliday).toBe(false);
    });
  });

  describe('isHoliday', () => {
    it('should return true for a public holiday', async () => {
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue(
        mockParseResult([
          {
            dateKind: '01',
            dateName: '신정',
            isHoliday: 'Y',
            locdate: 20240101,
            seq: 1,
          },
        ]),
      );

      const result = await adapter.isHoliday('20240101');

      expect(result).toBe(true);
    });

    it('should return false for a regular day', async () => {
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue(mockParseResult([]));

      const result = await adapter.isHoliday('20240102');

      expect(result).toBe(false);
    });

    it('should return false for non-holiday special days', async () => {
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue(
        mockParseResult([
          {
            dateKind: '01',
            dateName: '식목일',
            isHoliday: 'N',
            locdate: 20240405,
            seq: 1,
          },
        ]),
      );

      const result = await adapter.isHoliday('20240405');

      expect(result).toBe(false);
    });
  });

  describe('Input validation', () => {
    it('should reject year below minimum', async () => {
      await expect(adapter.getHolidays({ year: 1899 })).rejects.toThrow(
        ValidationError,
      );
    });

    it('should reject year above maximum', async () => {
      await expect(adapter.getHolidays({ year: 2101 })).rejects.toThrow(
        ValidationError,
      );
    });

    it('should reject non-integer year', async () => {
      await expect(adapter.getHolidays({ year: 2024.5 })).rejects.toThrow(
        ValidationError,
      );
    });

    it('should reject month below 1', async () => {
      await expect(
        adapter.getHolidays({ year: 2024, month: 0 }),
      ).rejects.toThrow(ValidationError);
    });

    it('should reject month above 12', async () => {
      await expect(
        adapter.getHolidays({ year: 2024, month: 13 }),
      ).rejects.toThrow(ValidationError);
    });

    it('should reject non-integer month', async () => {
      await expect(
        adapter.getHolidays({ year: 2024, month: 1.5 }),
      ).rejects.toThrow(ValidationError);
    });

    it('should reject invalid date format in isHoliday', async () => {
      await expect(adapter.isHoliday('2024-01-01')).rejects.toThrow(
        ValidationError,
      );
    });

    it('should reject short date in isHoliday', async () => {
      await expect(adapter.isHoliday('202401')).rejects.toThrow(
        ValidationError,
      );
    });
  });
});
