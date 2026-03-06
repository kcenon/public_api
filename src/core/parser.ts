import { XMLParser } from 'fast-xml-parser';
import { ParseError } from './errors.js';
import type { RawHttpResponse } from './http-client.js';
import type {
  ApiResponse,
  PaginationInfo,
  ResponseMeta,
} from '../types/common.js';
import type {
  RawApiResponse,
  RawApiResponseHeader,
} from '../types/response.js';

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  parseTagValue: true,
  trimValues: true,
});

/** Successful result code from data.go.kr APIs. */
const SUCCESS_CODE = '00';

/** Known error XML root element from public API error responses. */
const XML_ERROR_ROOT = 'OpenAPI_ServiceResponse';

export class ResponseParser {
  /**
   * Parse a raw HTTP response into a normalized ApiResponse.
   * Auto-detects JSON vs XML format based on Content-Type and content.
   */
  parse<T>(raw: RawHttpResponse): ApiResponse<T> {
    const format = this.detectFormat(raw);
    const meta: ResponseMeta = {
      cached: false,
      timestamp: new Date(),
      responseTime: raw.responseTime,
    };

    try {
      if (format === 'json') {
        return this.parseJson<T>(raw.body, meta);
      }
      return this.parseXml<T>(raw.body, meta);
    } catch (error) {
      if (error instanceof ParseError) throw error;

      throw new ParseError(
        `Failed to parse ${format} response: ${error instanceof Error ? error.message : String(error)}`,
        { rawResponse: raw.body, originalError: error },
      );
    }
  }

  private detectFormat(raw: RawHttpResponse): 'json' | 'xml' {
    const contentType = (raw.headers['content-type'] ?? '').toLowerCase();

    if (contentType.includes('json')) return 'json';
    if (contentType.includes('xml')) return 'xml';

    // Fallback: inspect content
    const trimmed = raw.body.trimStart();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json';
    if (trimmed.startsWith('<')) return 'xml';

    return 'json';
  }

  private parseJson<T>(body: string, meta: ResponseMeta): ApiResponse<T> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(body);
    } catch (error) {
      throw new ParseError('Invalid JSON response', {
        rawResponse: body,
        originalError: error,
      });
    }

    // Check for standard data.go.kr response wrapper
    if (this.isRawApiResponse(parsed)) {
      return this.normalizeRawResponse<T>(
        parsed as unknown as RawApiResponse<T>,
        meta,
      );
    }

    // Pass-through for non-standard responses (e.g. odcloud)
    return {
      success: true,
      data: parsed as T,
      meta,
    };
  }

  private parseXml<T>(body: string, meta: ResponseMeta): ApiResponse<T> {
    let parsed: unknown;
    try {
      parsed = xmlParser.parse(body);
    } catch (error) {
      throw new ParseError('Invalid XML response', {
        rawResponse: body,
        originalError: error,
      });
    }

    // Check for OpenAPI error format
    const obj = parsed as Record<string, unknown>;
    if (obj[XML_ERROR_ROOT]) {
      const errorResp = obj[XML_ERROR_ROOT] as Record<string, unknown>;
      const cmmMsgHeader = errorResp['cmmMsgHeader'] as
        | Record<string, unknown>
        | undefined;

      const errMsg =
        (cmmMsgHeader?.['errMsg'] as string) ?? 'Unknown API error';
      const returnAuthMsg = (cmmMsgHeader?.['returnAuthMsg'] as string) ?? '';
      throw new ParseError(
        `API error: ${errMsg}${returnAuthMsg ? ` (${returnAuthMsg})` : ''}`,
        { rawResponse: body },
      );
    }

    // Standard data.go.kr XML response wrapper
    if (obj['response']) {
      const rawResp = obj as unknown as RawApiResponse<T>;
      return this.normalizeRawResponse<T>(rawResp, meta);
    }

    // Non-standard XML
    return {
      success: true,
      data: parsed as T,
      meta,
    };
  }

  private normalizeRawResponse<T>(
    raw: RawApiResponse<T>,
    meta: ResponseMeta,
  ): ApiResponse<T> {
    const header: RawApiResponseHeader = raw.response.header;
    const body = raw.response.body;

    // XML parser may convert '00' to number 0; normalize for comparison
    if (String(header.resultCode).padStart(2, '0') !== SUCCESS_CODE) {
      throw new ParseError(
        `API error (${header.resultCode}): ${header.resultMsg}`,
        { rawResponse: JSON.stringify(raw) },
      );
    }

    // Normalize items — always return an array
    let data: T;
    if (body.items !== undefined) {
      const items = body.items.item;
      data = (Array.isArray(items) ? items : [items]) as unknown as T;
    } else {
      data = [] as unknown as T;
    }

    // Extract pagination if available
    let pagination: PaginationInfo | undefined;
    if (
      body.totalCount !== undefined &&
      body.numOfRows !== undefined &&
      body.pageNo !== undefined
    ) {
      const pageSize = body.numOfRows;
      pagination = {
        currentPage: body.pageNo,
        totalPages: pageSize > 0 ? Math.ceil(body.totalCount / pageSize) : 0,
        totalCount: body.totalCount,
        pageSize,
      };
    }

    return {
      success: true,
      data,
      pagination,
      meta,
    };
  }

  private isRawApiResponse(obj: unknown): obj is RawApiResponse<unknown> {
    if (typeof obj !== 'object' || obj === null) return false;
    const resp = (obj as Record<string, unknown>)['response'];
    if (typeof resp !== 'object' || resp === null) return false;
    const header = (resp as Record<string, unknown>)['header'];
    return (
      typeof header === 'object' && header !== null && 'resultCode' in header
    );
  }
}
