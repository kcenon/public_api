/**
 * Weather adapter utilities: coordinate conversion and category mapping.
 */

/** Grid coordinates for the weather API. */
export interface GridCoordinate {
  nx: number;
  ny: number;
}

/**
 * Convert WGS84 latitude/longitude to KMA grid coordinates.
 *
 * Uses Lambert Conformal Conic (LCC) projection with parameters
 * defined by the Korea Meteorological Administration.
 */
export function latLngToGrid(lat: number, lng: number): GridCoordinate {
  const RE = 6371.00877; // Earth radius (km)
  const GRID = 5.0; // Grid spacing (km)
  const SLAT1 = 30.0; // Standard latitude 1
  const SLAT2 = 60.0; // Standard latitude 2
  const OLON = 126.0; // Reference longitude
  const OLAT = 38.0; // Reference latitude
  const XO = 43; // Reference X grid
  const YO = 136; // Reference Y grid

  const DEGRAD = Math.PI / 180.0;

  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;

  let sn =
    Math.tan(Math.PI * 0.25 + slat2 * 0.5) /
    Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);

  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;

  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);

  let ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
  ra = (re * sf) / Math.pow(ra, sn);

  let theta = lng * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;

  return {
    nx: Math.floor(ra * Math.sin(theta) + XO + 0.5),
    ny: Math.floor(ro - ra * Math.cos(theta) + YO + 0.5),
  };
}

/** Weather category codes and their descriptions. */
const CATEGORY_MAP: Record<string, { ko: string; en: string }> = {
  POP: { ko: '강수확률', en: 'Precipitation Probability' },
  PTY: { ko: '강수형태', en: 'Precipitation Type' },
  PCP: { ko: '1시간 강수량', en: '1-Hour Precipitation' },
  REH: { ko: '습도', en: 'Humidity' },
  SNO: { ko: '1시간 신적설', en: '1-Hour Snowfall' },
  SKY: { ko: '하늘상태', en: 'Sky Condition' },
  TMP: { ko: '1시간 기온', en: '1-Hour Temperature' },
  TMN: { ko: '일 최저기온', en: 'Daily Min Temperature' },
  TMX: { ko: '일 최고기온', en: 'Daily Max Temperature' },
  UUU: { ko: '풍속(동서성분)', en: 'Wind Speed (E-W)' },
  VVV: { ko: '풍속(남북성분)', en: 'Wind Speed (N-S)' },
  WAV: { ko: '파고', en: 'Wave Height' },
  VEC: { ko: '풍향', en: 'Wind Direction' },
  WSD: { ko: '풍속', en: 'Wind Speed' },
  // Ultra-short-term additional categories
  T1H: { ko: '기온', en: 'Temperature' },
  RN1: { ko: '1시간 강수량', en: '1-Hour Precipitation' },
  LGT: { ko: '낙뢰', en: 'Lightning' },
};

/** Get human-readable category name. */
export function getCategoryName(
  code: string,
  lang: 'ko' | 'en' = 'ko',
): string {
  return CATEGORY_MAP[code]?.[lang] ?? code;
}

/** Precipitation type code descriptions. */
const PTY_MAP: Record<string, { ko: string; en: string }> = {
  '0': { ko: '없음', en: 'None' },
  '1': { ko: '비', en: 'Rain' },
  '2': { ko: '비/눈', en: 'Rain/Snow' },
  '3': { ko: '눈', en: 'Snow' },
  '4': { ko: '소나기', en: 'Shower' },
  '5': { ko: '빗방울', en: 'Drizzle' },
  '6': { ko: '빗방울눈날림', en: 'Drizzle/Snow' },
  '7': { ko: '눈날림', en: 'Snow Flurry' },
};

/** Sky condition code descriptions. */
const SKY_MAP: Record<string, { ko: string; en: string }> = {
  '1': { ko: '맑음', en: 'Clear' },
  '3': { ko: '구름많음', en: 'Mostly Cloudy' },
  '4': { ko: '흐림', en: 'Overcast' },
};

/** Get description for a category value code. */
export function getValueDescription(
  category: string,
  value: string,
  lang: 'ko' | 'en' = 'ko',
): string | undefined {
  if (category === 'PTY') return PTY_MAP[value]?.[lang];
  if (category === 'SKY') return SKY_MAP[value]?.[lang];
  return undefined;
}
