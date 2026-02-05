# Holiday API Specification

공휴일 정보 조회 서비스 API 스펙 문서

> **Source**: https://www.data.go.kr/data/15012690/openapi.do
> **Provider**: 한국천문연구원 (Korea Astronomy and Space Science Institute)
> **Last Updated**: 2026-02-05

---

## Overview

| Item | Value |
|------|-------|
| **Service Name** | 특일 정보 조회 서비스 |
| **Base URL** | `https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService` |
| **Protocol** | REST API (HTTP GET) |
| **Response Format** | XML, JSON |
| **Authentication** | Service Key (Query Parameter) |

---

## Endpoints

### 1. 국경일 정보 조회 (getHoliDeInfo)

| Item | Value |
|------|-------|
| **Endpoint** | `/getHoliDeInfo` |
| **Method** | GET |
| **Description** | 국경일 정보 조회 |

#### Request Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `serviceKey` | String | ✅ | 인증키 (Decoded) | `AbCdEf...` |
| `pageNo` | Integer | ❌ | 페이지 번호 | `1` |
| `numOfRows` | Integer | ❌ | 한 페이지 결과 수 | `100` |
| `solYear` | String | ✅ | 연도 (YYYY) | `2026` |
| `solMonth` | String | ❌ | 월 (MM) | `01` |

#### Response Structure (JSON)

```json
{
  "response": {
    "header": {
      "resultCode": "00",
      "resultMsg": "NORMAL_SERVICE"
    },
    "body": {
      "items": {
        "item": [
          {
            "dateKind": "01",
            "dateName": "신정",
            "isHoliday": "Y",
            "locdate": 20260101,
            "seq": 1
          }
        ]
      },
      "numOfRows": 100,
      "pageNo": 1,
      "totalCount": 15
    }
  }
}
```

---

### 2. 공휴일 정보 조회 (getRestDeInfo)

| Item | Value |
|------|-------|
| **Endpoint** | `/getRestDeInfo` |
| **Method** | GET |
| **Description** | 공휴일(국경일+기념일+명절 등) 정보 조회 |

#### Request Parameters

동일 (getHoliDeInfo와 같음)

---

### 3. 기념일 정보 조회 (getAnniversaryInfo)

| Item | Value |
|------|-------|
| **Endpoint** | `/getAnniversaryInfo` |
| **Method** | GET |
| **Description** | 기념일 정보 조회 (비공휴일 포함) |

---

### 4. 24절기 정보 조회 (get24DivisionsInfo)

| Item | Value |
|------|-------|
| **Endpoint** | `/get24DivisionsInfo` |
| **Method** | GET |
| **Description** | 24절기 정보 조회 |

---

### 5. 잡절 정보 조회 (getSundryDayInfo)

| Item | Value |
|------|-------|
| **Endpoint** | `/getSundryDayInfo` |
| **Method** | GET |
| **Description** | 잡절(삼복, 초복 등) 정보 조회 |

---

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `dateKind` | String | 종류 코드 (01: 국경일, 02: 기념일, 03: 24절기, 04: 잡절) |
| `dateName` | String | 명칭 |
| `isHoliday` | String | 공휴일 여부 (Y/N) |
| `locdate` | Integer | 날짜 (YYYYMMDD) |
| `seq` | Integer | 순번 |

---

## Code Tables

### dateKind (종류 코드)

| Code | Description |
|------|-------------|
| `01` | 국경일 |
| `02` | 기념일 |
| `03` | 24절기 |
| `04` | 잡절 |

---

## Korean Holidays List (2026 Reference)

| Date | Name | Type |
|------|------|------|
| 01-01 | 신정 | 공휴일 |
| 설날 연휴 | 설날 | 공휴일 (음력 1.1 기준 전후 1일) |
| 03-01 | 삼일절 | 공휴일 |
| 05-05 | 어린이날 | 공휴일 |
| 부처님오신날 | 석가탄신일 | 공휴일 (음력 4.8) |
| 06-06 | 현충일 | 공휴일 |
| 08-15 | 광복절 | 공휴일 |
| 추석 연휴 | 추석 | 공휴일 (음력 8.15 기준 전후 1일) |
| 10-03 | 개천절 | 공휴일 |
| 10-09 | 한글날 | 공휴일 |
| 12-25 | 성탄절 | 공휴일 |

---

## Rate Limits

| Account Type | Daily Limit |
|--------------|-------------|
| Development | 1,000 calls |
| Production | 10,000+ calls |

---

## Sample Request

```bash
curl "https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo?\
serviceKey=YOUR_DECODED_KEY&\
solYear=2026&\
numOfRows=100&\
_type=json"
```

---

## SDK Interface Design

```typescript
interface HolidayAdapter {
  // 국경일 조회
  getNationalHolidays(params: HolidayParams): Promise<HolidayResponse>;

  // 공휴일 조회 (전체)
  getPublicHolidays(params: HolidayParams): Promise<HolidayResponse>;

  // 기념일 조회
  getAnniversaries(params: HolidayParams): Promise<HolidayResponse>;

  // 24절기 조회
  get24Divisions(params: HolidayParams): Promise<HolidayResponse>;

  // 잡절 조회
  getSundryDays(params: HolidayParams): Promise<HolidayResponse>;

  // 편의 메서드: 특정 날짜가 공휴일인지 확인
  isHoliday(date: string | Date): Promise<boolean>;

  // 편의 메서드: 연간 공휴일 목록
  getYearlyHolidays(year: number): Promise<Holiday[]>;

  // 편의 메서드: 다음 공휴일
  getNextHoliday(fromDate?: Date): Promise<Holiday>;
}

interface HolidayParams {
  year: number;        // YYYY
  month?: number;      // 1-12
  pageNo?: number;
  numOfRows?: number;
}

interface Holiday {
  date: string;        // YYYY-MM-DD
  name: string;
  type: 'national' | 'anniversary' | 'division' | 'sundry';
  isHoliday: boolean;
}
```

---

## Notes

1. **음력 변환**: 설날, 추석, 석가탄신일 등은 음력 기준이므로 매년 날짜가 변동됩니다.
2. **대체공휴일**: 공휴일이 주말과 겹칠 경우 대체공휴일이 지정될 수 있습니다.
3. **캐싱 권장**: 공휴일 데이터는 연 1회 변경되므로 장기 캐싱(24시간~7일) 권장.
4. **연간 조회**: 한 번에 연간 전체 데이터를 조회하여 캐싱하는 것이 효율적입니다.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| Current | 2026 | 현재 버전 |
