/** Parameters for weather forecast queries. */
export interface WeatherForecastParams {
  /** Base date in YYYYMMDD format. */
  baseDate: string;
  /** Base time in HHmm format. */
  baseTime: string;
  /** Grid X coordinate (1-999). Use nx/ny or lat/lng. */
  nx?: number;
  /** Grid Y coordinate (1-999). Use nx/ny or lat/lng. */
  ny?: number;
  /** Latitude (WGS84). Auto-converts to grid coordinates. */
  lat?: number;
  /** Longitude (WGS84). Auto-converts to grid coordinates. */
  lng?: number;
  /** Number of rows per page. */
  numOfRows?: number;
  /** Page number. */
  pageNo?: number;
}

/** Normalized weather forecast item. */
export interface WeatherForecast {
  /** Base date (YYYYMMDD). */
  baseDate: string;
  /** Base time (HHmm). */
  baseTime: string;
  /** Category code (e.g., TMP, POP, SKY). */
  category: string;
  /** Human-readable category name. */
  categoryName: string;
  /** Forecast date (YYYYMMDD). */
  fcstDate: string;
  /** Forecast time (HHmm). */
  fcstTime: string;
  /** Forecast value. */
  fcstValue: string;
  /** Grid X coordinate. */
  nx: number;
  /** Grid Y coordinate. */
  ny: number;
}

/** Raw forecast item from the API. */
export interface RawWeatherItem {
  baseDate: string;
  baseTime: string;
  category: string;
  fcstDate: string;
  fcstTime: string;
  fcstValue: string | number;
  nx: number;
  ny: number;
}

/** Normalized observation item (ultra-short-term). */
export interface WeatherObservation {
  /** Base date (YYYYMMDD). */
  baseDate: string;
  /** Base time (HHmm). */
  baseTime: string;
  /** Category code. */
  category: string;
  /** Human-readable category name. */
  categoryName: string;
  /** Observed value. */
  obsrValue: string;
  /** Grid X coordinate. */
  nx: number;
  /** Grid Y coordinate. */
  ny: number;
}

/** Raw observation item from the API. */
export interface RawObservationItem {
  baseDate: string;
  baseTime: string;
  category: string;
  obsrValue: string | number;
  nx: number;
  ny: number;
}
