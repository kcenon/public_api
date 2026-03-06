import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AddressAdapter } from '../../src/adapters/address/index.js';
import type { AdapterContext } from '../../src/types/adapter.js';
import { ValidationError, ParseError } from '../../src/core/errors.js';

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

function mockJusoResponse<T>(juso: T[], totalCount = 1) {
  return {
    results: {
      common: {
        totalCount: String(totalCount),
        currentPage: '1',
        countPerPage: '10',
        errorCode: '0',
        errorMessage: '정상',
      },
      juso,
    },
  };
}

const sampleJusoItem = {
  roadAddr: '서울특별시 강남구 테헤란로 131(역삼동, 한국지식재산센터)',
  roadAddrPart1: '서울특별시 강남구 테헤란로 131',
  roadAddrPart2: '(역삼동, 한국지식재산센터)',
  jibunAddr: '서울특별시 강남구 역삼동 635-4',
  zipNo: '06236',
  admCd: '1168010100',
  rnMgtSn: '116804166031',
  bdMgtSn: '1168010100106350004000001',
  bdNm: '한국지식재산센터',
  siNm: '서울특별시',
  sggNm: '강남구',
  emdNm: '역삼동',
  rn: '테헤란로',
  udrtYn: '0',
  buldMnnm: '131',
  buldSlno: '0',
};

describe('AddressAdapter', () => {
  let adapter: AddressAdapter;
  let context: AdapterContext;

  beforeEach(() => {
    context = createMockContext();
    adapter = new AddressAdapter(context);
  });

  describe('Initialization', () => {
    it('should set adapter name to "address"', () => {
      expect(adapter.name).toBe('address');
    });
  });

  describe('search', () => {
    it('should search addresses by keyword', async () => {
      const httpResponse = {
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: '{}',
        responseTime: 100,
      };
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue({
        success: true,
        data: mockJusoResponse([sampleJusoItem]),
        meta: { cached: false, timestamp: new Date(), responseTime: 100 },
      });

      const result = await adapter.search({ keyword: '테헤란로 131' });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].roadAddress).toBe(
        '서울특별시 강남구 테헤란로 131(역삼동, 한국지식재산센터)',
      );
      expect(result.data[0].jibunAddress).toBe(
        '서울특별시 강남구 역삼동 635-4',
      );
      expect(result.data[0].postalCode).toBe('06236');
      expect(result.data[0].buildingName).toBe('한국지식재산센터');
      expect(result.data[0].siNm).toBe('서울특별시');
      expect(result.data[0].sggNm).toBe('강남구');
      expect(result.data[0].emdNm).toBe('역삼동');
      expect(result.data[0].roadName).toBe('테헤란로');
      expect(result.data[0].buildingNumber).toBe('131');
    });

    it('should use confmKey for authentication', async () => {
      const httpResponse = {
        status: 200,
        headers: {},
        body: '{}',
        responseTime: 100,
      };
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue({
        success: true,
        data: mockJusoResponse([]),
        meta: { cached: false, timestamp: new Date(), responseTime: 100 },
      });

      await adapter.search({ keyword: '강남구' });

      expect(context.httpClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          serviceKeyParam: 'confmKey',
        }),
      );
    });

    it('should include pagination in response', async () => {
      const httpResponse = {
        status: 200,
        headers: {},
        body: '{}',
        responseTime: 100,
      };
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue({
        success: true,
        data: mockJusoResponse([sampleJusoItem], 25),
        meta: { cached: false, timestamp: new Date(), responseTime: 100 },
      });

      const result = await adapter.search({
        keyword: '테헤란로',
        countPerPage: 10,
      });

      expect(result.pagination).toBeDefined();
      expect(result.pagination!.totalCount).toBe(25);
      expect(result.pagination!.totalPages).toBe(3);
      expect(result.pagination!.pageSize).toBe(10);
      expect(result.pagination!.currentPage).toBe(1);
    });

    it('should handle empty search results', async () => {
      const httpResponse = {
        status: 200,
        headers: {},
        body: '{}',
        responseTime: 100,
      };
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue({
        success: true,
        data: mockJusoResponse([], 0),
        meta: { cached: false, timestamp: new Date(), responseTime: 100 },
      });

      const result = await adapter.search({ keyword: '존재하지않는주소' });

      expect(result.data).toHaveLength(0);
    });

    it('should omit buildingSubNumber when value is "0"', async () => {
      const httpResponse = {
        status: 200,
        headers: {},
        body: '{}',
        responseTime: 100,
      };
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue({
        success: true,
        data: mockJusoResponse([{ ...sampleJusoItem, buldSlno: '0' }]),
        meta: { cached: false, timestamp: new Date(), responseTime: 100 },
      });

      const result = await adapter.search({ keyword: '테헤란로' });

      expect(result.data[0].buildingSubNumber).toBeUndefined();
    });

    it('should include buildingSubNumber when non-zero', async () => {
      const httpResponse = {
        status: 200,
        headers: {},
        body: '{}',
        responseTime: 100,
      };
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue({
        success: true,
        data: mockJusoResponse([{ ...sampleJusoItem, buldSlno: '5' }]),
        meta: { cached: false, timestamp: new Date(), responseTime: 100 },
      });

      const result = await adapter.search({ keyword: '테헤란로' });

      expect(result.data[0].buildingSubNumber).toBe('5');
    });
  });

  describe('getCoordinate', () => {
    it('should return coordinates for an address', async () => {
      const httpResponse = {
        status: 200,
        headers: {},
        body: '{}',
        responseTime: 100,
      };
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue({
        success: true,
        data: mockJusoResponse([
          {
            admCd: '1168010100',
            rnMgtSn: '116804166031',
            bdMgtSn: '1168010100106350004000001',
            udrtYn: '0',
            buldMnnm: '131',
            buldSlno: '0',
            entX: '127.0286009',
            entY: '37.4953615',
            bdNm: '한국지식재산센터',
          },
        ]),
        meta: { cached: false, timestamp: new Date(), responseTime: 100 },
      });

      const result = await adapter.getCoordinate({
        admCd: '1168010100',
        rnMgtSn: '116804166031',
        udrtYn: '0',
        buldMnnm: '131',
        buldSlno: '0',
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].latitude).toBeCloseTo(37.4953615);
      expect(result.data[0].longitude).toBeCloseTo(127.0286009);
      expect(result.data[0].admCd).toBe('1168010100');
    });
  });

  describe('searchEnglish', () => {
    it('should return English address results', async () => {
      const httpResponse = {
        status: 200,
        headers: {},
        body: '{}',
        responseTime: 100,
      };
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue({
        success: true,
        data: mockJusoResponse([
          {
            roadAddr: '131, Teheran-ro, Gangnam-gu, Seoul',
            jibunAddr: '635-4, Yeoksam-dong, Gangnam-gu, Seoul',
            zipNo: '06236',
            siNm: 'Seoul',
            sggNm: 'Gangnam-gu',
            emdNm: 'Yeoksam-dong',
            rn: 'Teheran-ro',
            udrtYn: '0',
            buldMnnm: '131',
            buldSlno: '0',
          },
        ]),
        meta: { cached: false, timestamp: new Date(), responseTime: 100 },
      });

      const result = await adapter.searchEnglish({
        keyword: 'Teheran-ro',
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].roadAddress).toBe(
        '131, Teheran-ro, Gangnam-gu, Seoul',
      );
      expect(result.data[0].siNm).toBe('Seoul');
      expect(result.data[0].postalCode).toBe('06236');
    });
  });

  describe('getPostalCode', () => {
    it('should return postal code for a keyword', async () => {
      const httpResponse = {
        status: 200,
        headers: {},
        body: '{}',
        responseTime: 100,
      };
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue({
        success: true,
        data: mockJusoResponse([sampleJusoItem]),
        meta: { cached: false, timestamp: new Date(), responseTime: 100 },
      });

      const postalCode = await adapter.getPostalCode('테헤란로 131');

      expect(postalCode).toBe('06236');
    });

    it('should return undefined when no results found', async () => {
      const httpResponse = {
        status: 200,
        headers: {},
        body: '{}',
        responseTime: 100,
      };
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue({
        success: true,
        data: mockJusoResponse([], 0),
        meta: { cached: false, timestamp: new Date(), responseTime: 100 },
      });

      const postalCode = await adapter.getPostalCode('존재하지않는주소');

      expect(postalCode).toBeUndefined();
    });
  });

  describe('Input validation', () => {
    it('should reject keyword shorter than 2 characters', async () => {
      await expect(adapter.search({ keyword: '강' })).rejects.toThrow(
        ValidationError,
      );
    });

    it('should reject empty keyword', async () => {
      await expect(adapter.search({ keyword: '' })).rejects.toThrow(
        ValidationError,
      );
    });

    it('should reject whitespace-only keyword', async () => {
      await expect(adapter.search({ keyword: '  ' })).rejects.toThrow(
        ValidationError,
      );
    });

    it('should reject short keyword for searchEnglish', async () => {
      await expect(adapter.searchEnglish({ keyword: 'a' })).rejects.toThrow(
        ValidationError,
      );
    });

    it('should reject short keyword for getPostalCode', async () => {
      await expect(adapter.getPostalCode('강')).rejects.toThrow(
        ValidationError,
      );
    });
  });

  describe('Error handling', () => {
    it('should throw ParseError for juso API error code', async () => {
      const httpResponse = {
        status: 200,
        headers: {},
        body: '{}',
        responseTime: 100,
      };
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue({
        success: true,
        data: {
          results: {
            common: {
              totalCount: '0',
              currentPage: '1',
              countPerPage: '10',
              errorCode: '-999',
              errorMessage: '시스템 에러',
            },
            juso: null,
          },
        },
        meta: { cached: false, timestamp: new Date(), responseTime: 100 },
      });

      await expect(adapter.search({ keyword: '강남구' })).rejects.toThrow(
        ParseError,
      );
    });

    it('should throw ParseError for unexpected response format', async () => {
      const httpResponse = {
        status: 200,
        headers: {},
        body: '{}',
        responseTime: 100,
      };
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue({
        success: true,
        data: { unexpected: 'format' },
        meta: { cached: false, timestamp: new Date(), responseTime: 100 },
      });

      await expect(adapter.search({ keyword: '강남구' })).rejects.toThrow(
        ParseError,
      );
    });

    it('should handle null juso array in response', async () => {
      const httpResponse = {
        status: 200,
        headers: {},
        body: '{}',
        responseTime: 100,
      };
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue({
        success: true,
        data: {
          results: {
            common: {
              totalCount: '0',
              currentPage: '1',
              countPerPage: '10',
              errorCode: '0',
              errorMessage: '정상',
            },
            juso: null,
          },
        },
        meta: { cached: false, timestamp: new Date(), responseTime: 100 },
      });

      const result = await adapter.search({ keyword: '강남구' });

      expect(result.data).toHaveLength(0);
    });
  });
});
