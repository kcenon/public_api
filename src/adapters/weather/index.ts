import { BaseAdapter } from '../base.js';
import { ValidationError } from '../../core/errors.js';
import { latLngToGrid, getCategoryName } from './utils.js';
import type { AdapterContext } from '../../types/adapter.js';
import type { ApiResponse } from '../../types/common.js';
import type {
  WeatherForecastParams,
  WeatherForecast,
  WeatherObservation,
  RawWeatherItem,
  RawObservationItem,
} from './types.js';

const BASE_URL = 'apis.data.go.kr/1360000/VilageFcstInfoService_2.0';
const DEFAULT_TTL = 3600; // 1 hour
const DATE_PATTERN = /^\d{8}$/;
const TIME_PATTERN = /^\d{4}$/;

/**
 * Weather adapter for Korea Meteorological Administration (기상청) API.
 *
 * Provides access to short-term forecasts, ultra-short-term forecasts,
 * and ultra-short-term observations.
 */
export class WeatherAdapter extends BaseAdapter {
  constructor(context: AdapterContext) {
    super(context);
  }

  protected getAdapterName(): string {
    return 'weather';
  }

  protected getBaseUrl(): string {
    return BASE_URL;
  }

  protected getDefaultTtl(): number {
    return DEFAULT_TTL;
  }

  /** Get short-term (village) forecast. */
  async getVilageFcst(
    params: WeatherForecastParams,
  ): Promise<ApiResponse<WeatherForecast[]>> {
    const { nx, ny } = this.resolveCoordinates(params);
    this.validateDatetime(params.baseDate, params.baseTime);
    this.validateGridCoords(nx, ny);

    const result = await this.request<RawWeatherItem[]>({
      path: '/getVilageFcst',
      params: {
        dataType: 'JSON',
        baseDate: params.baseDate,
        base_time: params.baseTime,
        nx,
        ny,
      },
      numOfRows: params.numOfRows,
      pageNo: params.pageNo,
    });

    return {
      ...result,
      data: result.data.map((item) => this.normalizeForecast(item)),
    };
  }

  /** Get ultra-short-term observation (current conditions). */
  async getUltraSrtNcst(
    params: WeatherForecastParams,
  ): Promise<ApiResponse<WeatherObservation[]>> {
    const { nx, ny } = this.resolveCoordinates(params);
    this.validateDatetime(params.baseDate, params.baseTime);
    this.validateGridCoords(nx, ny);

    const result = await this.request<RawObservationItem[]>({
      path: '/getUltraSrtNcst',
      params: {
        dataType: 'JSON',
        baseDate: params.baseDate,
        base_time: params.baseTime,
        nx,
        ny,
      },
      numOfRows: params.numOfRows,
      pageNo: params.pageNo,
    });

    return {
      ...result,
      data: result.data.map((item) => this.normalizeObservation(item)),
    };
  }

  /** Get ultra-short-term forecast. */
  async getUltraSrtFcst(
    params: WeatherForecastParams,
  ): Promise<ApiResponse<WeatherForecast[]>> {
    const { nx, ny } = this.resolveCoordinates(params);
    this.validateDatetime(params.baseDate, params.baseTime);
    this.validateGridCoords(nx, ny);

    const result = await this.request<RawWeatherItem[]>({
      path: '/getUltraSrtFcst',
      params: {
        dataType: 'JSON',
        baseDate: params.baseDate,
        base_time: params.baseTime,
        nx,
        ny,
      },
      numOfRows: params.numOfRows,
      pageNo: params.pageNo,
    });

    return {
      ...result,
      data: result.data.map((item) => this.normalizeForecast(item)),
    };
  }

  /** Resolve grid coordinates from params (lat/lng or direct nx/ny). */
  private resolveCoordinates(params: WeatherForecastParams): {
    nx: number;
    ny: number;
  } {
    if (params.lat !== undefined && params.lng !== undefined) {
      return latLngToGrid(params.lat, params.lng);
    }

    if (params.nx !== undefined && params.ny !== undefined) {
      return { nx: params.nx, ny: params.ny };
    }

    throw new ValidationError(
      'Either nx/ny grid coordinates or lat/lng must be provided',
      { field: 'nx,ny' },
    );
  }

  private validateDatetime(baseDate: string, baseTime: string): void {
    if (!DATE_PATTERN.test(baseDate)) {
      throw new ValidationError(
        `baseDate must be in YYYYMMDD format, got "${baseDate}"`,
        { field: 'baseDate' },
      );
    }
    if (!TIME_PATTERN.test(baseTime)) {
      throw new ValidationError(
        `baseTime must be in HHmm format, got "${baseTime}"`,
        { field: 'baseTime' },
      );
    }
  }

  private validateGridCoords(nx: number, ny: number): void {
    if (!Number.isInteger(nx) || nx < 1 || nx > 999) {
      throw new ValidationError(
        `nx must be an integer between 1 and 999, got ${nx}`,
        { field: 'nx' },
      );
    }
    if (!Number.isInteger(ny) || ny < 1 || ny > 999) {
      throw new ValidationError(
        `ny must be an integer between 1 and 999, got ${ny}`,
        { field: 'ny' },
      );
    }
  }

  private normalizeForecast(item: RawWeatherItem): WeatherForecast {
    return {
      baseDate: String(item.baseDate),
      baseTime: String(item.baseTime),
      category: item.category,
      categoryName: getCategoryName(item.category),
      fcstDate: String(item.fcstDate),
      fcstTime: String(item.fcstTime),
      fcstValue: String(item.fcstValue),
      nx: item.nx,
      ny: item.ny,
    };
  }

  private normalizeObservation(item: RawObservationItem): WeatherObservation {
    return {
      baseDate: String(item.baseDate),
      baseTime: String(item.baseTime),
      category: item.category,
      categoryName: getCategoryName(item.category),
      obsrValue: String(item.obsrValue),
      nx: item.nx,
      ny: item.ny,
    };
  }
}
