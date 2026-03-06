import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RealEstateAdapter } from '../../src/adapters/real-estate/index.js';
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

describe('RealEstateAdapter', () => {
  let adapter: RealEstateAdapter;
  let context: AdapterContext;

  beforeEach(() => {
    context = createMockContext();
    adapter = new RealEstateAdapter(context);
  });

  describe('Initialization', () => {
    it('should set adapter name to "real-estate"', () => {
      expect(adapter.name).toBe('real-estate');
    });
  });

  describe('getApartmentSales', () => {
    it('should return apartment sale transactions', async () => {
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue(
        mockParseResult([
          {
            aptNm: '래미안',
            dealAmount: '12,500',
            excluUseAr: '84.99',
            floor: '15',
            dealYear: '2024',
            dealMonth: '1',
            dealDay: '15',
            buildYear: '2010',
            roadNm: '테헤란로',
            roadNmBonbun: '131',
            roadNmBubun: '0',
            sggCd: '11680',
          },
        ]),
      );

      const result = await adapter.getApartmentSales({
        lawdCd: '11680',
        dealYmd: '202401',
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('래미안');
      expect(result.data[0].price).toBe(125000000);
      expect(result.data[0].area).toBeCloseTo(84.99);
      expect(result.data[0].floor).toBe(15);
      expect(result.data[0].dealDate).toBe('2024-01-15');
      expect(result.data[0].buildYear).toBe(2010);
      expect(result.data[0].roadAddress).toBe('테헤란로 131');
      expect(result.data[0].dealType).toBe('SALE');
    });

    it('should handle road address with sub-number', async () => {
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue(
        mockParseResult([
          {
            aptNm: '타워팰리스',
            dealAmount: '50,000',
            excluUseAr: '150',
            floor: '30',
            dealYear: 2024,
            dealMonth: 3,
            dealDay: 5,
            buildYear: 2005,
            roadNm: '도곡로',
            roadNmBonbun: 18,
            roadNmBubun: 3,
            sggCd: '11680',
          },
        ]),
      );

      const result = await adapter.getApartmentSales({
        lawdCd: '11680',
        dealYmd: '202403',
      });

      expect(result.data[0].roadAddress).toBe('도곡로 18-3');
      expect(result.data[0].dealDate).toBe('2024-03-05');
    });
  });

  describe('getApartmentRentals', () => {
    it('should classify jeonse correctly', async () => {
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue(
        mockParseResult([
          {
            aptNm: '래미안',
            deposit: '30,000',
            monthlyRentAmount: '0',
            excluUseAr: '84.99',
            floor: '10',
            dealYear: '2024',
            dealMonth: '1',
            dealDay: '20',
            buildYear: '2010',
            sggCd: '11680',
          },
        ]),
      );

      const result = await adapter.getApartmentRentals({
        lawdCd: '11680',
        dealYmd: '202401',
      });

      expect(result.data[0].dealType).toBe('JEONSE');
      expect(result.data[0].deposit).toBe(300000000);
      expect(result.data[0].monthlyRent).toBeUndefined();
    });

    it('should classify monthly rent correctly', async () => {
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue(
        mockParseResult([
          {
            aptNm: '래미안',
            deposit: '10,000',
            monthlyRentAmount: '50',
            excluUseAr: '84.99',
            floor: '10',
            dealYear: '2024',
            dealMonth: '1',
            dealDay: '20',
            buildYear: '2010',
            sggCd: '11680',
          },
        ]),
      );

      const result = await adapter.getApartmentRentals({
        lawdCd: '11680',
        dealYmd: '202401',
      });

      expect(result.data[0].dealType).toBe('MONTHLY_RENT');
      expect(result.data[0].deposit).toBe(100000000);
      expect(result.data[0].monthlyRent).toBe(500000);
    });
  });

  describe('getOfficeSales', () => {
    it('should return officetel sale transactions', async () => {
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue(
        mockParseResult([
          {
            offiNm: '강남오피스텔',
            dealAmount: '5,000',
            excluUseAr: '30.5',
            floor: '5',
            dealYear: '2024',
            dealMonth: '2',
            dealDay: '10',
            buildYear: '2015',
            sggCd: '11680',
          },
        ]),
      );

      const result = await adapter.getOfficeSales({
        lawdCd: '11680',
        dealYmd: '202402',
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('강남오피스텔');
      expect(result.data[0].price).toBe(50000000);
      expect(result.data[0].dealType).toBe('SALE');
    });
  });

  describe('parsePrice', () => {
    it('should parse comma-separated manwon to KRW', () => {
      expect(RealEstateAdapter.parsePrice('12,500')).toBe(125000000);
    });

    it('should parse without commas', () => {
      expect(RealEstateAdapter.parsePrice('500')).toBe(5000000);
    });

    it('should handle whitespace', () => {
      expect(RealEstateAdapter.parsePrice(' 12,500 ')).toBe(125000000);
    });

    it('should return 0 for invalid input', () => {
      expect(RealEstateAdapter.parsePrice('')).toBe(0);
    });
  });

  describe('formatPrice', () => {
    it('should format price with eok and manwon', () => {
      expect(RealEstateAdapter.formatPrice(125000000)).toBe('1억 2,500만원');
    });

    it('should format price with only eok', () => {
      expect(RealEstateAdapter.formatPrice(100000000)).toBe('1억원');
    });

    it('should format price with only manwon', () => {
      expect(RealEstateAdapter.formatPrice(50000000)).toBe('5,000만원');
    });

    it('should format zero', () => {
      expect(RealEstateAdapter.formatPrice(0)).toBe('0원');
    });

    it('should format multi-eok price', () => {
      expect(RealEstateAdapter.formatPrice(3500000000)).toBe('35억원');
    });
  });

  describe('Input validation', () => {
    it('should reject invalid LAWD_CD (too short)', async () => {
      await expect(
        adapter.getApartmentSales({ lawdCd: '1168', dealYmd: '202401' }),
      ).rejects.toThrow(ValidationError);
    });

    it('should reject invalid LAWD_CD (too long)', async () => {
      await expect(
        adapter.getApartmentSales({ lawdCd: '116800', dealYmd: '202401' }),
      ).rejects.toThrow(ValidationError);
    });

    it('should reject non-numeric LAWD_CD', async () => {
      await expect(
        adapter.getApartmentSales({ lawdCd: 'abcde', dealYmd: '202401' }),
      ).rejects.toThrow(ValidationError);
    });

    it('should reject invalid deal date format', async () => {
      await expect(
        adapter.getApartmentSales({ lawdCd: '11680', dealYmd: '2024-01' }),
      ).rejects.toThrow(ValidationError);
    });

    it('should reject too short deal date', async () => {
      await expect(
        adapter.getApartmentSales({ lawdCd: '11680', dealYmd: '20241' }),
      ).rejects.toThrow(ValidationError);
    });

    it('should validate params for getApartmentRentals', async () => {
      await expect(
        adapter.getApartmentRentals({ lawdCd: '123', dealYmd: '202401' }),
      ).rejects.toThrow(ValidationError);
    });

    it('should validate params for getOfficeSales', async () => {
      await expect(
        adapter.getOfficeSales({ lawdCd: '11680', dealYmd: 'abc' }),
      ).rejects.toThrow(ValidationError);
    });
  });
});
