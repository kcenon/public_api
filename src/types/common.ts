/**
 * Shared type definitions for the Public Data SDK.
 */

/** Standard API response wrapper. */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: PaginationInfo;
  meta: ResponseMeta;
}

/** Pagination information from API response. */
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
}

/** Response metadata. */
export interface ResponseMeta {
  requestId?: string;
  cached: boolean;
  timestamp: Date;
  responseTime: number;
}
