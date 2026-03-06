/** Holiday kind classification. */
export type HolidayKind = 'public_holiday' | 'national_day' | 'solar_term';

/** Parameters for holiday/national day queries. */
export interface HolidayParams {
  /** Year to query (e.g., 2024). */
  year: number;
  /** Month to query (1-12). Optional; omit for full year. */
  month?: number;
}

/** Normalized holiday result. */
export interface Holiday {
  /** Date in YYYYMMDD format. */
  date: string;
  /** Holiday name in Korean. */
  name: string;
  /** Whether this is a public holiday (day off). */
  isHoliday: boolean;
  /** Classification of the special day. */
  kind: HolidayKind;
}

/** Raw item from data.go.kr holiday API. */
export interface RawHolidayItem {
  dateKind: string;
  dateName: string;
  isHoliday: string;
  locdate: number | string;
  seq: number;
}
