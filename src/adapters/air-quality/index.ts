import { BaseAdapter } from '../base.js';
import { ValidationError } from '../../core/errors.js';
import type { AdapterContext } from '../../types/adapter.js';
import type { ApiResponse } from '../../types/common.js';
import type {
  AirQualityByStationParams,
  AirQualityByRegionParams,
  NearbyStationParams,
  AirQualityData,
  AirQualityGrade,
  NearbyStation,
  RawAirQualityItem,
  RawNearbyStationItem,
} from './types.js';

const BASE_URL = 'apis.data.go.kr/B552584';
const DEFAULT_TTL = 3600; // 1 hour

/** Map API grade string to normalized grade enum. */
const GRADE_MAP: Record<string, AirQualityGrade> = {
  '1': 'GOOD',
  '2': 'MODERATE',
  '3': 'UNHEALTHY_SENSITIVE',
  '4': 'UNHEALTHY',
  '5': 'VERY_UNHEALTHY',
  '6': 'HAZARDOUS',
};

/** Map dataTerm to API parameter value. */
const DATA_TERM_MAP: Record<string, string> = {
  DAILY: 'DAILY',
  MONTH: 'MONTH',
  '3MONTH': '3MONTH',
};

/**
 * Air Quality adapter for Korea Environment Corporation (한국환경공단)
 * air pollution information API.
 *
 * Provides real-time air quality measurements by station and region,
 * including CAI (Comprehensive Air-quality Index) grade interpretation.
 */
export class AirQualityAdapter extends BaseAdapter {
  constructor(context: AdapterContext) {
    super(context);
  }

  protected getAdapterName(): string {
    return 'air-quality';
  }

  protected getBaseUrl(): string {
    return BASE_URL;
  }

  protected getDefaultTtl(): number {
    return DEFAULT_TTL;
  }

  /** Get real-time air quality data by monitoring station name. */
  async getByStation(
    params: AirQualityByStationParams,
  ): Promise<ApiResponse<AirQualityData[]>> {
    if (!params.stationName || params.stationName.trim().length === 0) {
      throw new ValidationError('Station name is required', {
        field: 'stationName',
      });
    }

    const dataTerm = params.dataTerm ?? 'DAILY';
    if (!DATA_TERM_MAP[dataTerm]) {
      throw new ValidationError(
        `Invalid dataTerm: "${dataTerm}". Must be DAILY, MONTH, or 3MONTH`,
        { field: 'dataTerm' },
      );
    }

    const result = await this.request<RawAirQualityItem[]>({
      path: '/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty',
      params: {
        stationName: params.stationName,
        dataTerm: DATA_TERM_MAP[dataTerm],
        returnType: 'json',
      },
    });

    return {
      ...result,
      data: Array.isArray(result.data)
        ? result.data.map((item) => this.normalizeAirQuality(item))
        : [],
    };
  }

  /** Get real-time air quality data by region (sido). */
  async getByRegion(
    params: AirQualityByRegionParams,
  ): Promise<ApiResponse<AirQualityData[]>> {
    if (!params.sidoName || params.sidoName.trim().length === 0) {
      throw new ValidationError('Region name (sidoName) is required', {
        field: 'sidoName',
      });
    }

    const result = await this.request<RawAirQualityItem[]>({
      path: '/ArpltnInforInqireSvc/getCtprvnRltmMesureDnsty',
      params: {
        sidoName: params.sidoName,
        returnType: 'json',
      },
      numOfRows: 100,
    });

    return {
      ...result,
      data: Array.isArray(result.data)
        ? result.data.map((item) => this.normalizeAirQuality(item))
        : [],
    };
  }

  /** Find nearby monitoring stations by TM coordinates. */
  async getNearbyStation(
    params: NearbyStationParams,
  ): Promise<ApiResponse<NearbyStation[]>> {
    if (typeof params.tmX !== 'number' || isNaN(params.tmX)) {
      throw new ValidationError('tmX must be a valid number', {
        field: 'tmX',
      });
    }
    if (typeof params.tmY !== 'number' || isNaN(params.tmY)) {
      throw new ValidationError('tmY must be a valid number', {
        field: 'tmY',
      });
    }

    const result = await this.request<RawNearbyStationItem[]>({
      path: '/MsrstnInfoInqireSvc/getNearbyMsrstnList',
      params: {
        tmX: params.tmX,
        tmY: params.tmY,
        returnType: 'json',
      },
    });

    return {
      ...result,
      data: Array.isArray(result.data)
        ? result.data.map((item) => this.normalizeNearbyStation(item))
        : [],
    };
  }

  /** Interpret a CAI grade string into a normalized grade. */
  static interpretGrade(grade: string): AirQualityGrade {
    return GRADE_MAP[grade] ?? 'UNKNOWN';
  }

  private normalizeAirQuality(item: RawAirQualityItem): AirQualityData {
    return {
      stationName: item.stationName,
      measureDatetime: item.dataTime,
      pm10Value: this.parseNumericValue(item.pm10Value),
      pm25Value: this.parseNumericValue(item.pm25Value),
      o3Value: this.parseNumericValue(item.o3Value),
      no2Value: this.parseNumericValue(item.no2Value),
      coValue: this.parseNumericValue(item.coValue),
      so2Value: this.parseNumericValue(item.so2Value),
      khaiValue: this.parseNumericValue(item.khaiValue),
      khaiGrade: AirQualityAdapter.interpretGrade(item.khaiGrade),
      pm10Grade: AirQualityAdapter.interpretGrade(item.pm10Grade),
      pm25Grade: AirQualityAdapter.interpretGrade(item.pm25Grade),
    };
  }

  private normalizeNearbyStation(item: RawNearbyStationItem): NearbyStation {
    return {
      stationName: item.stationName,
      addr: item.addr,
      tm: item.tm,
    };
  }

  private parseNumericValue(value: string): number | null {
    if (
      value === null ||
      value === undefined ||
      value === '-' ||
      value === ''
    ) {
      return null;
    }
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  }
}
