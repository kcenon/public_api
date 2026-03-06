/** Air quality grade classification (CAI-based). */
export type AirQualityGrade =
  | 'GOOD'
  | 'MODERATE'
  | 'UNHEALTHY_SENSITIVE'
  | 'UNHEALTHY'
  | 'VERY_UNHEALTHY'
  | 'HAZARDOUS'
  | 'UNKNOWN';

/** Data term for measurement query. */
export type DataTerm = 'DAILY' | 'MONTH' | '3MONTH';

/** Parameters for station-based air quality query. */
export interface AirQualityByStationParams {
  /** Monitoring station name. */
  stationName: string;
  /** Data period (default: DAILY). */
  dataTerm?: DataTerm;
}

/** Parameters for region-based air quality query. */
export interface AirQualityByRegionParams {
  /** Region name (sido/city/province, e.g., '서울', '경기'). */
  sidoName: string;
}

/** Parameters for nearby station lookup. */
export interface NearbyStationParams {
  /** TM X coordinate. */
  tmX: number;
  /** TM Y coordinate. */
  tmY: number;
}

/** Normalized air quality measurement result. */
export interface AirQualityData {
  /** Monitoring station name. */
  stationName: string;
  /** Measurement datetime string. */
  measureDatetime: string;
  /** PM10 concentration (ug/m3). */
  pm10Value: number | null;
  /** PM2.5 concentration (ug/m3). */
  pm25Value: number | null;
  /** Ozone concentration (ppm). */
  o3Value: number | null;
  /** Nitrogen dioxide concentration (ppm). */
  no2Value: number | null;
  /** Carbon monoxide concentration (ppm). */
  coValue: number | null;
  /** Sulfur dioxide concentration (ppm). */
  so2Value: number | null;
  /** Comprehensive Air-quality Index. */
  khaiValue: number | null;
  /** CAI overall grade. */
  khaiGrade: AirQualityGrade;
  /** PM10 grade. */
  pm10Grade: AirQualityGrade;
  /** PM2.5 grade. */
  pm25Grade: AirQualityGrade;
}

/** Normalized nearby station result. */
export interface NearbyStation {
  /** Station name. */
  stationName: string;
  /** Station address. */
  addr: string;
  /** Distance in km. */
  tm: number;
}

/** Raw air quality item from API. */
export interface RawAirQualityItem {
  stationName: string;
  dataTime: string;
  pm10Value: string;
  pm25Value: string;
  o3Value: string;
  no2Value: string;
  coValue: string;
  so2Value: string;
  khaiValue: string;
  khaiGrade: string;
  pm10Grade: string;
  pm25Grade: string;
}

/** Raw nearby station item from API. */
export interface RawNearbyStationItem {
  stationName: string;
  addr: string;
  tm: number;
}
