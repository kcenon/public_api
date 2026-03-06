import { describe, it, expect, beforeEach } from 'vitest';
import { WeatherAdapter } from '../../src/adapters/weather/index.js';
import { HolidayAdapter } from '../../src/adapters/holiday/index.js';
import { AddressAdapter } from '../../src/adapters/address/index.js';
import { createTestContextNoCache } from '../helpers/mock-http-client.js';
import { fixtureToHttpResponse } from '../helpers/fixture-loader.js';
import {
  ParseError,
  ValidationError,
  NetworkError,
} from '../../src/core/errors.js';

describe('Error propagation integration', () => {
  let context: ReturnType<typeof createTestContextNoCache>;

  beforeEach(() => {
    context = createTestContextNoCache();
  });

  describe('data.go.kr error codes', () => {
    it('propagates auth error (code 20) as ParseError', async () => {
      const adapter = new WeatherAdapter(context);
      context.httpClient.request.mockResolvedValue(
        fixtureToHttpResponse('weather/forecast-error-auth.json'),
      );

      await expect(
        adapter.getVilageFcst({
          baseDate: '20240115',
          baseTime: '0500',
          nx: 60,
          ny: 127,
        }),
      ).rejects.toThrow(ParseError);
    });

    it('includes error code and message in ParseError', async () => {
      const adapter = new WeatherAdapter(context);
      context.httpClient.request.mockResolvedValue(
        fixtureToHttpResponse('weather/forecast-error-auth.json'),
      );

      try {
        await adapter.getVilageFcst({
          baseDate: '20240115',
          baseTime: '0500',
          nx: 60,
          ny: 127,
        });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ParseError);
        expect((error as ParseError).message).toContain('20');
        expect((error as ParseError).message).toContain(
          'SERVICE_KEY_IS_NOT_REGISTERED_ERROR',
        );
      }
    });

    it('propagates no-data error (code 03) as ParseError', async () => {
      const adapter = new WeatherAdapter(context);
      context.httpClient.request.mockResolvedValue(
        fixtureToHttpResponse('weather/forecast-error-nodata.json'),
      );

      await expect(
        adapter.getVilageFcst({
          baseDate: '20240115',
          baseTime: '0500',
          nx: 60,
          ny: 127,
        }),
      ).rejects.toThrow(ParseError);
    });

    it('propagates server error (code 01) as ParseError', async () => {
      const adapter = new WeatherAdapter(context);
      context.httpClient.request.mockResolvedValue(
        fixtureToHttpResponse('common/error-server.json'),
      );

      await expect(
        adapter.getVilageFcst({
          baseDate: '20240115',
          baseTime: '0500',
          nx: 60,
          ny: 127,
        }),
      ).rejects.toThrow(ParseError);
    });
  });

  describe('XML error responses', () => {
    it('propagates XML auth error as ParseError', async () => {
      const adapter = new HolidayAdapter(context);
      context.httpClient.request.mockResolvedValue(
        fixtureToHttpResponse('common/error-xml-auth.xml'),
      );

      await expect(
        adapter.getHolidays({ year: 2024 }),
      ).rejects.toThrow(ParseError);
    });

    it('includes error message from XML response', async () => {
      const adapter = new HolidayAdapter(context);
      context.httpClient.request.mockResolvedValue(
        fixtureToHttpResponse('common/error-xml-auth.xml'),
      );

      try {
        await adapter.getHolidays({ year: 2024 });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ParseError);
        expect((error as ParseError).message).toContain(
          'SERVICE_KEY_IS_NOT_REGISTERED_ERROR',
        );
      }
    });
  });

  describe('juso.go.kr error responses', () => {
    it('propagates juso.go.kr error as Error', async () => {
      const adapter = new AddressAdapter(context);
      context.httpClient.request.mockResolvedValue(
        fixtureToHttpResponse('address/search-error.json'),
      );

      await expect(
        adapter.search({ keyword: '테헤란로' }),
      ).rejects.toThrow();
    });
  });

  describe('validation errors', () => {
    it('throws ValidationError for empty parameter values', async () => {
      const adapter = new WeatherAdapter(context);

      await expect(
        adapter.getVilageFcst({
          baseDate: '',
          baseTime: '0500',
          nx: 60,
          ny: 127,
        }),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('network errors', () => {
    it('propagates NetworkError from HTTP client', async () => {
      const adapter = new WeatherAdapter(context);
      context.httpClient.request.mockRejectedValue(
        new NetworkError('Connection timeout'),
      );

      await expect(
        adapter.getVilageFcst({
          baseDate: '20240115',
          baseTime: '0500',
          nx: 60,
          ny: 127,
        }),
      ).rejects.toThrow(NetworkError);
    });
  });
});
