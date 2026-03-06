import { BaseAdapter } from '../base.js';
import { ValidationError } from '../../core/errors.js';
import type { AdapterContext } from '../../types/adapter.js';
import type { ApiResponse } from '../../types/common.js';
import type {
  HolidayParams,
  Holiday,
  HolidayKind,
  RawHolidayItem,
} from './types.js';

const BASE_URL = 'apis.data.go.kr/B090041/openapi/service/SpcdeInfoService';
const DEFAULT_TTL = 2592000; // 30 days
const MIN_YEAR = 1900;
const MAX_YEAR = 2100;

/**
 * Holiday adapter for Korea Astronomy and Space Science Institute
 * (한국천문연구원) Special Day Information API.
 *
 * Provides public holidays, national days, and 24 solar terms (절기).
 * Uses standard data.go.kr authentication and response format.
 */
export class HolidayAdapter extends BaseAdapter {
  constructor(context: AdapterContext) {
    super(context);
  }

  protected getAdapterName(): string {
    return 'holiday';
  }

  protected getBaseUrl(): string {
    return BASE_URL;
  }

  protected getDefaultTtl(): number {
    return DEFAULT_TTL;
  }

  /** Get public holidays (공휴일) for a given year/month. */
  async getHolidays(params: HolidayParams): Promise<ApiResponse<Holiday[]>> {
    this.validateHolidayParams(params);

    const result = await this.request<RawHolidayItem[]>({
      path: '/getRestDeInfo',
      params: this.buildQueryParams(params),
      numOfRows: 50,
    });

    return {
      ...result,
      data: this.normalizeItems(result.data, 'public_holiday'),
    };
  }

  /** Get national days (기념일) for a given year/month. */
  async getNationalDays(
    params: HolidayParams,
  ): Promise<ApiResponse<Holiday[]>> {
    this.validateHolidayParams(params);

    const result = await this.request<RawHolidayItem[]>({
      path: '/getAnniversaryInfo',
      params: this.buildQueryParams(params),
      numOfRows: 50,
    });

    return {
      ...result,
      data: this.normalizeItems(result.data, 'national_day'),
    };
  }

  /** Get 24 solar terms (절기) for a given year/month. */
  async getSolarTerms(params: HolidayParams): Promise<ApiResponse<Holiday[]>> {
    this.validateHolidayParams(params);

    const result = await this.request<RawHolidayItem[]>({
      path: '/get24DivisionsInfo',
      params: this.buildQueryParams(params),
      numOfRows: 50,
    });

    return {
      ...result,
      data: this.normalizeItems(result.data, 'solar_term'),
    };
  }

  /**
   * Check if a specific date is a public holiday.
   * @param date Date in YYYYMMDD format.
   */
  async isHoliday(date: string): Promise<boolean> {
    if (!/^\d{8}$/.test(date)) {
      throw new ValidationError(
        `Date must be in YYYYMMDD format, got "${date}"`,
        { field: 'date' },
      );
    }

    const year = parseInt(date.slice(0, 4), 10);
    const month = parseInt(date.slice(4, 6), 10);

    const result = await this.getHolidays({ year, month });

    return result.data.some((h) => h.date === date && h.isHoliday);
  }

  private validateHolidayParams(params: HolidayParams): void {
    if (
      !Number.isInteger(params.year) ||
      params.year < MIN_YEAR ||
      params.year > MAX_YEAR
    ) {
      throw new ValidationError(
        `Year must be an integer between ${MIN_YEAR} and ${MAX_YEAR}, got ${params.year}`,
        { field: 'year' },
      );
    }

    if (params.month !== undefined) {
      if (
        !Number.isInteger(params.month) ||
        params.month < 1 ||
        params.month > 12
      ) {
        throw new ValidationError(
          `Month must be an integer between 1 and 12, got ${params.month}`,
          { field: 'month' },
        );
      }
    }
  }

  private buildQueryParams(
    params: HolidayParams,
  ): Record<string, string | number> {
    const query: Record<string, string | number> = {
      solYear: params.year,
    };

    if (params.month !== undefined) {
      query['solMonth'] = String(params.month).padStart(2, '0');
    }

    return query;
  }

  private normalizeItems(
    items: RawHolidayItem[],
    kind: HolidayKind,
  ): Holiday[] {
    return items.map((item) => ({
      date: String(item.locdate),
      name: item.dateName,
      isHoliday: item.isHoliday === 'Y',
      kind,
    }));
  }
}
