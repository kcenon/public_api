import { describe, it, expect } from 'vitest';
import { ResponseParser } from '../../src/core/parser.js';
import { ParseError } from '../../src/core/errors.js';
import type { RawHttpResponse } from '../../src/core/http-client.js';

function makeResponse(
  body: string,
  contentType = 'application/json',
): RawHttpResponse {
  return {
    status: 200,
    headers: { 'content-type': contentType },
    body,
    responseTime: 42,
  };
}

const parser = new ResponseParser();

describe('ResponseParser', () => {
  describe('JSON parsing', () => {
    it('should parse standard data.go.kr JSON response', () => {
      const raw = makeResponse(
        JSON.stringify({
          response: {
            header: { resultCode: '00', resultMsg: 'NORMAL_SERVICE' },
            body: {
              items: {
                item: [
                  { name: 'Seoul', value: 25 },
                  { name: 'Busan', value: 22 },
                ],
              },
              numOfRows: 10,
              pageNo: 1,
              totalCount: 2,
            },
          },
        }),
      );

      const result = parser.parse<Array<{ name: string; value: number }>>(raw);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe('Seoul');
      expect(result.pagination).toEqual({
        currentPage: 1,
        totalPages: 1,
        totalCount: 2,
        pageSize: 10,
      });
      expect(result.meta.responseTime).toBe(42);
      expect(result.meta.cached).toBe(false);
    });

    it('should normalize single item to array', () => {
      const raw = makeResponse(
        JSON.stringify({
          response: {
            header: { resultCode: '00', resultMsg: 'NORMAL_SERVICE' },
            body: {
              items: { item: { name: 'Seoul', value: 25 } },
              numOfRows: 10,
              pageNo: 1,
              totalCount: 1,
            },
          },
        }),
      );

      const result = parser.parse<Array<{ name: string; value: number }>>(raw);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Seoul');
    });

    it('should handle empty items', () => {
      const raw = makeResponse(
        JSON.stringify({
          response: {
            header: { resultCode: '00', resultMsg: 'NORMAL_SERVICE' },
            body: {
              numOfRows: 10,
              pageNo: 1,
              totalCount: 0,
            },
          },
        }),
      );

      const result = parser.parse<unknown[]>(raw);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should throw ParseError on API error in body', () => {
      const raw = makeResponse(
        JSON.stringify({
          response: {
            header: {
              resultCode: '12',
              resultMsg: 'LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR',
            },
            body: {},
          },
        }),
      );

      expect(() => parser.parse(raw)).toThrow(ParseError);
      expect(() => parser.parse(raw)).toThrow(/API error \(12\)/);
    });

    it('should pass through non-standard JSON responses', () => {
      const raw = makeResponse(
        JSON.stringify({ data: [1, 2, 3], total: 3 }),
      );

      const result = parser.parse<{ data: number[]; total: number }>(raw);

      expect(result.success).toBe(true);
      expect(result.data.data).toEqual([1, 2, 3]);
    });

    it('should throw ParseError on invalid JSON', () => {
      const raw = makeResponse('not valid json');

      expect(() => parser.parse(raw)).toThrow(ParseError);
      expect(() => parser.parse(raw)).toThrow(/Invalid JSON/);
    });

    it('should handle Korean characters in response', () => {
      const raw = makeResponse(
        JSON.stringify({
          response: {
            header: { resultCode: '00', resultMsg: 'NORMAL_SERVICE' },
            body: {
              items: { item: [{ addr: '서울특별시 종로구' }] },
              numOfRows: 10,
              pageNo: 1,
              totalCount: 1,
            },
          },
        }),
      );

      const result = parser.parse<Array<{ addr: string }>>(raw);
      expect(result.data[0].addr).toBe('서울특별시 종로구');
    });
  });

  describe('XML parsing', () => {
    it('should parse standard data.go.kr XML response', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<response>
  <header>
    <resultCode>00</resultCode>
    <resultMsg>NORMAL_SERVICE</resultMsg>
  </header>
  <body>
    <items>
      <item>
        <name>Seoul</name>
        <value>25</value>
      </item>
      <item>
        <name>Busan</name>
        <value>22</value>
      </item>
    </items>
    <numOfRows>10</numOfRows>
    <pageNo>1</pageNo>
    <totalCount>2</totalCount>
  </body>
</response>`;
      const raw = makeResponse(xml, 'application/xml');

      const result = parser.parse<Array<{ name: string; value: number }>>(raw);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe('Seoul');
      expect(result.pagination?.totalCount).toBe(2);
    });

    it('should normalize XML single item to array', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<response>
  <header>
    <resultCode>00</resultCode>
    <resultMsg>NORMAL_SERVICE</resultMsg>
  </header>
  <body>
    <items>
      <item>
        <name>Seoul</name>
      </item>
    </items>
    <numOfRows>10</numOfRows>
    <pageNo>1</pageNo>
    <totalCount>1</totalCount>
  </body>
</response>`;
      const raw = makeResponse(xml, 'text/xml');

      const result = parser.parse<Array<{ name: string }>>(raw);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Seoul');
    });

    it('should detect OpenAPI_ServiceResponse error XML', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<OpenAPI_ServiceResponse>
  <cmmMsgHeader>
    <errMsg>SERVICE_KEY_IS_NOT_REGISTERED_ERROR</errMsg>
    <returnAuthMsg>INVALID KEY</returnAuthMsg>
    <returnReasonCode>30</returnReasonCode>
  </cmmMsgHeader>
</OpenAPI_ServiceResponse>`;
      const raw = makeResponse(xml, 'text/xml');

      expect(() => parser.parse(raw)).toThrow(ParseError);
      expect(() => parser.parse(raw)).toThrow(/SERVICE_KEY_IS_NOT_REGISTERED/);
    });

    it('should handle non-standard XML as pass-through', () => {
      const raw = makeResponse(
        '<custom><data>hello</data></custom>',
        'application/xml',
      );

      const result = parser.parse<{ custom: { data: string } }>(raw);
      expect(result.success).toBe(true);
      expect(result.data.custom.data).toBe('hello');
    });
  });

  describe('Format detection', () => {
    it('should detect JSON from content-type', () => {
      const raw = makeResponse('{"a":1}', 'application/json; charset=utf-8');
      const result = parser.parse<{ a: number }>(raw);
      expect(result.success).toBe(true);
    });

    it('should detect XML from content-type', () => {
      const xml = '<response><header><resultCode>00</resultCode><resultMsg>OK</resultMsg></header><body></body></response>';
      const raw = makeResponse(xml, 'text/xml; charset=utf-8');
      const result = parser.parse(raw);
      expect(result.success).toBe(true);
    });

    it('should fallback to content inspection for JSON', () => {
      const raw = makeResponse('{"data":"ok"}', '');
      const result = parser.parse<{ data: string }>(raw);
      expect(result.data.data).toBe('ok');
    });

    it('should fallback to content inspection for XML', () => {
      const xml = '<response><header><resultCode>00</resultCode><resultMsg>OK</resultMsg></header><body></body></response>';
      const raw = makeResponse(xml, '');
      const result = parser.parse(raw);
      expect(result.success).toBe(true);
    });

    it('should default to JSON for unknown format', () => {
      const raw = makeResponse('42', 'text/plain');
      const result = parser.parse<number>(raw);
      expect(result.data).toBe(42);
    });
  });

  describe('Pagination', () => {
    it('should calculate totalPages correctly', () => {
      const raw = makeResponse(
        JSON.stringify({
          response: {
            header: { resultCode: '00', resultMsg: 'OK' },
            body: {
              items: { item: [] },
              numOfRows: 10,
              pageNo: 1,
              totalCount: 25,
            },
          },
        }),
      );

      const result = parser.parse(raw);

      expect(result.pagination?.totalPages).toBe(3);
      expect(result.pagination?.currentPage).toBe(1);
      expect(result.pagination?.pageSize).toBe(10);
    });

    it('should handle zero pageSize without division error', () => {
      const raw = makeResponse(
        JSON.stringify({
          response: {
            header: { resultCode: '00', resultMsg: 'OK' },
            body: {
              numOfRows: 0,
              pageNo: 1,
              totalCount: 0,
            },
          },
        }),
      );

      const result = parser.parse(raw);
      expect(result.pagination?.totalPages).toBe(0);
    });

    it('should omit pagination when fields are missing', () => {
      const raw = makeResponse(
        JSON.stringify({
          response: {
            header: { resultCode: '00', resultMsg: 'OK' },
            body: {},
          },
        }),
      );

      const result = parser.parse(raw);
      expect(result.pagination).toBeUndefined();
    });
  });
});
