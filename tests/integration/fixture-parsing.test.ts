import { describe, it, expect, beforeEach } from 'vitest';
import { WeatherAdapter } from '../../src/adapters/weather/index.js';
import { HolidayAdapter } from '../../src/adapters/holiday/index.js';
import { TransportAdapter } from '../../src/adapters/transport/index.js';
import { AirQualityAdapter } from '../../src/adapters/air-quality/index.js';
import { RealEstateAdapter } from '../../src/adapters/real-estate/index.js';
import { AddressAdapter } from '../../src/adapters/address/index.js';
import { createTestContextNoCache } from '../helpers/mock-http-client.js';
import { fixtureToHttpResponse } from '../helpers/fixture-loader.js';

/**
 * End-to-end fixture parsing tests.
 * Verifies that fixture data flows correctly through the full pipeline:
 * HTTP response → parser → adapter transformation → typed output.
 */
describe('Fixture parsing integration', () => {
  let context: ReturnType<typeof createTestContextNoCache>;

  beforeEach(() => {
    context = createTestContextNoCache();
  });

  describe('Weather adapter', () => {
    it('parses forecast fixture into typed forecast items', async () => {
      const adapter = new WeatherAdapter(context);
      context.httpClient.request.mockResolvedValue(
        fixtureToHttpResponse('weather/forecast-success.json'),
      );

      const result = await adapter.getVilageFcst({
        baseDate: '20240115',
        baseTime: '0500',
        nx: 60,
        ny: 127,
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(result.data[0]).toMatchObject({
        category: 'TMP',
        fcstValue: '-3',
        nx: 60,
        ny: 127,
      });
      expect(result.pagination).toMatchObject({
        totalCount: 3,
        currentPage: 1,
      });
    });
  });

  describe('Holiday adapter', () => {
    it('parses holiday fixture into typed holiday items', async () => {
      const adapter = new HolidayAdapter(context);
      context.httpClient.request.mockResolvedValue(
        fixtureToHttpResponse('holiday/holidays-success.json'),
      );

      const result = await adapter.getHolidays({ year: 2024 });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(4);
      expect(result.data[0]).toMatchObject({
        name: '신정',
        isHoliday: true,
        date: '20240101',
      });
      expect(result.data[3]).toMatchObject({
        name: '삼일절',
        date: '20240301',
      });
    });
  });

  describe('Transport adapter', () => {
    it('parses bus arrival fixture into typed arrival items', async () => {
      const adapter = new TransportAdapter(context);
      context.httpClient.request.mockResolvedValue(
        fixtureToHttpResponse('transport/arrival-success.json'),
      );

      const result = await adapter.getBusArrival({
        cityCode: 31,
        nodeId: 'GMB137',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toMatchObject({
        currentStation: '시청앞',
        routeNumber: '100',
        arrivalTime: 420,
      });
    });
  });

  describe('Air Quality adapter', () => {
    it('parses air quality fixture into typed data items', async () => {
      const adapter = new AirQualityAdapter(context);
      context.httpClient.request.mockResolvedValue(
        fixtureToHttpResponse('air-quality/station-success.json'),
      );

      const result = await adapter.getByStation({
        stationName: '종로구',
        dataTerm: 'DAILY',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        stationName: '종로구',
        measureDatetime: '2024-01-15 14:00',
      });
      expect(result.data[0].pm10Value).toBe(45);
      expect(result.data[0].pm25Value).toBe(22);
    });
  });

  describe('Real Estate adapter', () => {
    it('parses apartment sale fixture into typed transactions', async () => {
      const adapter = new RealEstateAdapter(context);
      context.httpClient.request.mockResolvedValue(
        fixtureToHttpResponse('real-estate/apartment-sale-success.json'),
      );

      const result = await adapter.getApartmentSales({
        lawdCd: '11680',
        dealYmd: '202401',
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe('래미안');
      expect(result.data[0].price).toBe(180000000);
      expect(result.data[0].priceFormatted).toBe('1억 8,000만원');
      expect(result.data[1].name).toBe('삼성래미안');
      expect(result.data[1].price).toBe(125000000);
    });
  });

  describe('Address adapter', () => {
    it('parses address search fixture into typed address results', async () => {
      const adapter = new AddressAdapter(context);
      context.httpClient.request.mockResolvedValue(
        fixtureToHttpResponse('address/search-success.json'),
      );

      const result = await adapter.search({ keyword: '테헤란로 131' });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toMatchObject({
        roadAddress: '서울특별시 강남구 테헤란로 131 (역삼동, 한국지식재산센터)',
        postalCode: '06133',
      });
    });
  });
});
