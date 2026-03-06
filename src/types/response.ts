/**
 * API response types for Korean public data APIs.
 */

/** Raw API response header from data.go.kr APIs. */
export interface RawApiResponseHeader {
  resultCode: string;
  resultMsg: string;
}

/** Raw API response body from data.go.kr APIs. */
export interface RawApiResponseBody<T> {
  items?: {
    item: T | T[];
  };
  numOfRows?: number;
  pageNo?: number;
  totalCount?: number;
}

/** Raw API response wrapper from data.go.kr APIs. */
export interface RawApiResponse<T> {
  response: {
    header: RawApiResponseHeader;
    body: RawApiResponseBody<T>;
  };
}
