import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BusinessAdapter } from '../../src/adapters/business/index.js';
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

describe('BusinessAdapter', () => {
  let adapter: BusinessAdapter;
  let context: AdapterContext;

  beforeEach(() => {
    context = createMockContext();
    adapter = new BusinessAdapter(context);
  });

  describe('Initialization', () => {
    it('should set adapter name to "business"', () => {
      expect(adapter.name).toBe('business');
    });
  });

  describe('getStatus', () => {
    it('should query single business number', async () => {
      const httpResponse = {
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: '{}',
        responseTime: 100,
      };
      vi.mocked(context.httpClient.request).mockResolvedValue(httpResponse);
      vi.mocked(context.parser.parse).mockReturnValue({
        success: true,
        data: {
          data: [
            {
              b_no: '1234567890',
              b_stt: '계속사업자',
              b_stt_cd: '01',
              tax_type: '일반과세자',
            },
          ],
        },
        meta: { cached: false, timestamp: new Date(), responseTime: 100 },
      });

      const result = await adapter.getStatus({
        businessNumbers: ['1234567890'],
      });

      expect(result.data[0].businessNumber).toBe('1234567890');
      expect(result.data[0].status).toBe('ACTIVE');
      expect(result.data[0].taxType).toBe('일반과세자');
    });

    it('should handle batch query', async () => {
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
          data: [
            { b_no: '1234567890', b_stt: '', b_stt_cd: '01', tax_type: '' },
            { b_no: '0987654321', b_stt: '', b_stt_cd: '03', tax_type: '' },
          ],
        },
        meta: { cached: false, timestamp: new Date(), responseTime: 100 },
      });

      const result = await adapter.getStatus({
        businessNumbers: ['1234567890', '0987654321'],
      });

      expect(result.data).toHaveLength(2);
      expect(result.data[0].status).toBe('ACTIVE');
      expect(result.data[1].status).toBe('CLOSED');
    });

    it('should auto-strip hyphens from business number', async () => {
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
          data: [
            { b_no: '1234567890', b_stt: '', b_stt_cd: '01', tax_type: '' },
          ],
        },
        meta: { cached: false, timestamp: new Date(), responseTime: 100 },
      });

      await adapter.getStatus({
        businessNumbers: ['123-45-67890'],
      });

      expect(context.httpClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            b_no: '1234567890',
          }),
        }),
      );
    });

    it('should map unknown status code to NOT_FOUND', async () => {
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
          data: [
            { b_no: '1234567890', b_stt: '', b_stt_cd: '99', tax_type: '' },
          ],
        },
        meta: { cached: false, timestamp: new Date(), responseTime: 100 },
      });

      const result = await adapter.getStatus({
        businessNumbers: ['1234567890'],
      });

      expect(result.data[0].status).toBe('NOT_FOUND');
    });
  });

  describe('validate', () => {
    it('should verify business authenticity', async () => {
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
          data: [
            {
              b_no: '1234567890',
              valid: '01',
              request_cnt: 1,
              status: { b_stt_cd: '01' },
            },
          ],
        },
        meta: { cached: false, timestamp: new Date(), responseTime: 100 },
      });

      const result = await adapter.validate({
        businesses: [
          {
            businessNumber: '1234567890',
            startDate: '20200101',
            representativeName: '홍길동',
          },
        ],
      });

      expect(result.data[0].valid).toBe(true);
      expect(result.data[0].businessNumber).toBe('1234567890');
    });
  });

  describe('Input validation', () => {
    it('should reject invalid business number format', async () => {
      await expect(
        adapter.getStatus({ businessNumbers: ['12345'] }),
      ).rejects.toThrow(ValidationError);
    });

    it('should reject non-numeric business number', async () => {
      await expect(
        adapter.getStatus({ businessNumbers: ['abcdefghij'] }),
      ).rejects.toThrow(ValidationError);
    });

    it('should reject empty batch', async () => {
      await expect(
        adapter.getStatus({ businessNumbers: [] }),
      ).rejects.toThrow(ValidationError);
    });

    it('should reject batch exceeding 100', async () => {
      const numbers = Array.from({ length: 101 }, (_, i) =>
        String(i).padStart(10, '0'),
      );
      await expect(
        adapter.getStatus({ businessNumbers: numbers }),
      ).rejects.toThrow(ValidationError);
    });

    it('should reject invalid startDate in validate', async () => {
      await expect(
        adapter.validate({
          businesses: [
            {
              businessNumber: '1234567890',
              startDate: '2020-01-01',
              representativeName: '홍길동',
            },
          ],
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('should reject missing representativeName in validate', async () => {
      await expect(
        adapter.validate({
          businesses: [
            {
              businessNumber: '1234567890',
              startDate: '20200101',
              representativeName: '',
            },
          ],
        }),
      ).rejects.toThrow(ValidationError);
    });
  });
});
