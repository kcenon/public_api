# Weather API Specification

기상청 단기예보 조회서비스 API 스펙 문서

> **Source**: https://www.data.go.kr/data/15084084/openapi.do
> **Provider**: 기상청 (Korea Meteorological Administration)
> **Last Updated**: 2026-02-05

---

## Overview

| Item | Value |
|------|-------|
| **Service Name** | 단기예보 조회서비스 |
| **Base URL** | `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0` |
| **Protocol** | REST API (HTTP GET) |
| **Response Format** | XML, JSON |
| **Authentication** | Service Key (Query Parameter) |

---

## Endpoints

### 1. 단기예보 조회 (getVilageFcst)

| Item | Value |
|------|-------|
| **Endpoint** | `/getVilageFcst` |
| **Method** | GET |
| **Description** | 단기예보 정보를 조회 (3일간 예보) |

#### Request Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `serviceKey` | String | ✅ | 인증키 (Decoded) | `AbCdEf...` |
| `pageNo` | Integer | ❌ | 페이지 번호 | `1` |
| `numOfRows` | Integer | ❌ | 한 페이지 결과 수 | `1000` |
| `dataType` | String | ❌ | 응답 형식 (XML/JSON) | `JSON` |
| `base_date` | String | ✅ | 발표일자 (YYYYMMDD) | `20260205` |
| `base_time` | String | ✅ | 발표시각 (HHMM) | `0500` |
| `nx` | Integer | ✅ | 예보지점 X 좌표 | `55` |
| `ny` | Integer | ✅ | 예보지점 Y 좌표 | `127` |

#### Valid Base Times

단기예보는 1일 8회 발표됩니다:

| Base Time | 발표 시각 | 제공 시간 |
|-----------|----------|----------|
| `0200` | 02:00 | 02:10 이후 |
| `0500` | 05:00 | 05:10 이후 |
| `0800` | 08:00 | 08:10 이후 |
| `1100` | 11:00 | 11:10 이후 |
| `1400` | 14:00 | 14:10 이후 |
| `1700` | 17:00 | 17:10 이후 |
| `2000` | 20:00 | 20:10 이후 |
| `2300` | 23:00 | 23:10 이후 |

#### Response Structure (JSON)

```json
{
  "response": {
    "header": {
      "resultCode": "00",
      "resultMsg": "NORMAL_SERVICE"
    },
    "body": {
      "dataType": "JSON",
      "items": {
        "item": [
          {
            "baseDate": "20260205",
            "baseTime": "0500",
            "category": "TMP",
            "fcstDate": "20260205",
            "fcstTime": "0600",
            "fcstValue": "-3",
            "nx": 55,
            "ny": 127
          }
        ]
      },
      "pageNo": 1,
      "numOfRows": 1000,
      "totalCount": 809
    }
  }
}
```

---

### 2. 초단기실황 조회 (getUltraSrtNcst)

| Item | Value |
|------|-------|
| **Endpoint** | `/getUltraSrtNcst` |
| **Method** | GET |
| **Description** | 초단기실황 정보를 조회 (현재 날씨) |

#### Request Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `serviceKey` | String | ✅ | 인증키 (Decoded) | `AbCdEf...` |
| `pageNo` | Integer | ❌ | 페이지 번호 | `1` |
| `numOfRows` | Integer | ❌ | 한 페이지 결과 수 | `100` |
| `dataType` | String | ❌ | 응답 형식 | `JSON` |
| `base_date` | String | ✅ | 발표일자 (YYYYMMDD) | `20260205` |
| `base_time` | String | ✅ | 발표시각 (HHMM) | `0600` |
| `nx` | Integer | ✅ | 예보지점 X 좌표 | `55` |
| `ny` | Integer | ✅ | 예보지점 Y 좌표 | `127` |

#### Valid Base Times

매시간 정시에 발표 (40분 이후 제공)

---

### 3. 초단기예보 조회 (getUltraSrtFcst)

| Item | Value |
|------|-------|
| **Endpoint** | `/getUltraSrtFcst` |
| **Method** | GET |
| **Description** | 초단기예보 정보를 조회 (6시간 예보) |

#### Request Parameters

동일 (getUltraSrtNcst와 같음)

---

## Data Categories

### 단기예보 카테고리

| Code | Name | Unit | Description |
|------|------|------|-------------|
| `POP` | 강수확률 | % | 0~100 |
| `PTY` | 강수형태 | 코드 | 없음(0), 비(1), 비/눈(2), 눈(3), 소나기(4) |
| `PCP` | 1시간 강수량 | mm | 범주형 (강수없음, 1mm 미만, 1~29mm, 30~50mm, 50mm 이상) |
| `REH` | 습도 | % | 0~100 |
| `SNO` | 1시간 신적설 | cm | 범주형 (적설없음, 1cm 미만, 1~4cm, 5~9cm, 10cm 이상) |
| `SKY` | 하늘상태 | 코드 | 맑음(1), 구름많음(3), 흐림(4) |
| `TMP` | 1시간 기온 | ℃ | -50~50 |
| `TMN` | 일 최저기온 | ℃ | 06시 발표 |
| `TMX` | 일 최고기온 | ℃ | 15시 발표 |
| `UUU` | 풍속(동서) | m/s | 동(+), 서(-) |
| `VVV` | 풍속(남북) | m/s | 북(+), 남(-) |
| `WAV` | 파고 | M | 해상만 제공 |
| `VEC` | 풍향 | deg | 0~360 |
| `WSD` | 풍속 | m/s | 0~100 |

### 초단기실황/예보 카테고리

| Code | Name | Unit | Description |
|------|------|------|-------------|
| `T1H` | 기온 | ℃ | 현재 기온 |
| `RN1` | 1시간 강수량 | mm | 현재 강수량 |
| `UUU` | 풍속(동서) | m/s | |
| `VVV` | 풍속(남북) | m/s | |
| `REH` | 습도 | % | |
| `PTY` | 강수형태 | 코드 | |
| `VEC` | 풍향 | deg | |
| `WSD` | 풍속 | m/s | |
| `LGT` | 낙뢰 | kA | 초단기예보만 |

---

## Grid Coordinates

### 주요 도시 좌표

| City | nx | ny |
|------|----|----|
| 서울 | 60 | 127 |
| 부산 | 98 | 76 |
| 대구 | 89 | 90 |
| 인천 | 55 | 124 |
| 광주 | 58 | 74 |
| 대전 | 67 | 100 |
| 울산 | 102 | 84 |
| 세종 | 66 | 103 |
| 제주 | 52 | 38 |

### 좌표 변환

위경도 → 격자 좌표 변환 공식:

```
기준 정보:
- 지구 반경: 6371.00877 km
- 격자 간격: 5.0 km
- 기준점 위경도: 38.0°N, 126.0°E
- 기준점 격자: (43, 136)
- 투영 위도: 30.0°N, 60.0°N
```

---

## Error Responses

### JSON Error Response

```json
{
  "response": {
    "header": {
      "resultCode": "03",
      "resultMsg": "NODATA_ERROR"
    },
    "body": null
  }
}
```

### XML Error Response

```xml
<?xml version="1.0" encoding="UTF-8"?>
<OpenAPI_ServiceResponse>
  <cmmMsgHeader>
    <errMsg>SERVICE_KEY_IS_NOT_REGISTERED_ERROR</errMsg>
    <returnAuthMsg>SERVICE_KEY_IS_NOT_REGISTERED_ERROR</returnAuthMsg>
    <returnReasonCode>30</returnReasonCode>
  </cmmMsgHeader>
</OpenAPI_ServiceResponse>
```

---

## Rate Limits

| Account Type | Daily Limit |
|--------------|-------------|
| Development | 1,000 calls |
| Production | 10,000+ calls |

---

## Sample Request

```bash
curl "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?\
serviceKey=YOUR_DECODED_KEY&\
pageNo=1&\
numOfRows=1000&\
dataType=JSON&\
base_date=20260205&\
base_time=0500&\
nx=55&\
ny=127"
```

---

## SDK Interface Design

```typescript
interface WeatherAdapter {
  // 단기예보 조회
  getForecast(params: ForecastParams): Promise<ForecastResponse>;

  // 초단기실황 조회
  getCurrentConditions(params: CurrentParams): Promise<CurrentResponse>;

  // 초단기예보 조회
  getUltraShortForecast(params: UltraShortParams): Promise<ForecastResponse>;

  // 편의 메서드: 자동 날짜/시간
  getForecastForLocation(nx: number, ny: number): Promise<ForecastResponse>;

  // 편의 메서드: 가공된 데이터
  getProcessedForecast(params: ForecastParams): Promise<ProcessedWeatherData[]>;
}

interface ForecastParams {
  baseDate: string;   // YYYYMMDD
  baseTime: string;   // HHMM
  nx: number;         // Grid X
  ny: number;         // Grid Y
  pageNo?: number;
  numOfRows?: number;
}

interface ForecastItem {
  baseDate: string;
  baseTime: string;
  fcstDate: string;
  fcstTime: string;
  category: WeatherCategory;
  fcstValue: string;
  nx: number;
  ny: number;
}
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | 2021-06-xx | 현재 버전 |
| 1.0 | Legacy | 구버전 (폐기됨) |
