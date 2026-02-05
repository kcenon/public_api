# Air Quality API Specification

대기오염 정보 조회 서비스 API 스펙 문서

> **Source**: https://www.data.go.kr/data/15073861/openapi.do
> **Provider**: 한국환경공단 (Korea Environment Corporation)
> **Last Updated**: 2026-02-05

---

## Overview

| Item | Value |
|------|-------|
| **Service Name** | 에어코리아 대기오염정보 조회 서비스 |
| **Base URL** | `https://apis.data.go.kr/B552584/ArpltnInforInqireSvc` |
| **Protocol** | REST API (HTTP GET) |
| **Response Format** | XML, JSON |
| **Authentication** | Service Key (Query Parameter) |

---

## Endpoints

### 1. 측정소별 실시간 측정정보 조회

| Item | Value |
|------|-------|
| **Endpoint** | `/getMsrstnAcctoRltmMesureDnsty` |
| **Method** | GET |
| **Description** | 측정소별 실시간 대기오염 측정 정보 |

#### Request Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `serviceKey` | String | ✅ | 인증키 | `AbCdEf...` |
| `returnType` | String | ❌ | 응답 형식 (xml/json) | `json` |
| `numOfRows` | Integer | ❌ | 결과 수 | `100` |
| `pageNo` | Integer | ❌ | 페이지 번호 | `1` |
| `stationName` | String | ✅ | 측정소명 | `종로구` |
| `dataTerm` | String | ✅ | 데이터 기간 | `DAILY` |
| `ver` | String | ❌ | API 버전 | `1.3` |

#### dataTerm Values

| Value | Description |
|-------|-------------|
| `DAILY` | 1일 데이터 |
| `MONTH` | 1개월 데이터 |
| `3MONTH` | 3개월 데이터 |

#### Response Structure (JSON)

```json
{
  "response": {
    "header": {
      "resultCode": "00",
      "resultMsg": "NORMAL_SERVICE"
    },
    "body": {
      "items": [
        {
          "stationName": "종로구",
          "mangName": "도시대기",
          "dataTime": "2026-02-05 14:00",
          "so2Value": "0.003",
          "coValue": "0.4",
          "o3Value": "0.025",
          "no2Value": "0.018",
          "pm10Value": "45",
          "pm10Value24": "42",
          "pm25Value": "23",
          "pm25Value24": "21",
          "khaiValue": "72",
          "khaiGrade": "2",
          "so2Grade": "1",
          "coGrade": "1",
          "o3Grade": "1",
          "no2Grade": "1",
          "pm10Grade": "2",
          "pm25Grade": "2"
        }
      ],
      "numOfRows": 100,
      "pageNo": 1,
      "totalCount": 24
    }
  }
}
```

---

### 2. 시도별 실시간 측정정보 조회

| Item | Value |
|------|-------|
| **Endpoint** | `/getCtprvnRltmMesureDnsty` |
| **Method** | GET |
| **Description** | 시도별 대기오염 측정 정보 |

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `serviceKey` | String | ✅ | 인증키 |
| `returnType` | String | ❌ | 응답 형식 |
| `numOfRows` | Integer | ❌ | 결과 수 |
| `pageNo` | Integer | ❌ | 페이지 번호 |
| `sidoName` | String | ✅ | 시도명 |
| `ver` | String | ❌ | API 버전 |

#### sidoName Values

```
서울, 부산, 대구, 인천, 광주, 대전, 울산, 경기, 강원,
충북, 충남, 전북, 전남, 경북, 경남, 제주, 세종
```

---

### 3. 통합대기환경지수 나쁨 이상 측정소 조회

| Item | Value |
|------|-------|
| **Endpoint** | `/getUnityAirEnvrnIdexSnstiveAboveMsrstnList` |
| **Method** | GET |
| **Description** | 통합대기환경지수(CAI) 나쁨 이상 측정소 목록 |

---

### 4. 측정소 정보 조회

| Item | Value |
|------|-------|
| **Endpoint** | `/getMsrstnList` |
| **Base URL** | `https://apis.data.go.kr/B552584/MsrstnInfoInqireSvc` |
| **Method** | GET |
| **Description** | 측정소 목록 및 상세 정보 |

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `serviceKey` | String | ✅ | 인증키 |
| `returnType` | String | ❌ | 응답 형식 |
| `numOfRows` | Integer | ❌ | 결과 수 |
| `pageNo` | Integer | ❌ | 페이지 번호 |
| `addr` | String | ❌ | 주소 검색어 |

---

### 5. 근접 측정소 조회

| Item | Value |
|------|-------|
| **Endpoint** | `/getNearbyMsrstnList` |
| **Base URL** | `https://apis.data.go.kr/B552584/MsrstnInfoInqireSvc` |
| **Method** | GET |
| **Description** | 좌표 기반 근접 측정소 목록 |

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `serviceKey` | String | ✅ | 인증키 |
| `returnType` | String | ❌ | 응답 형식 |
| `tmX` | String | ✅ | TM X 좌표 |
| `tmY` | String | ✅ | TM Y 좌표 |

---

## Response Fields

### 측정 데이터 필드

| Field | Unit | Description |
|-------|------|-------------|
| `so2Value` | ppm | 아황산가스 농도 |
| `coValue` | ppm | 일산화탄소 농도 |
| `o3Value` | ppm | 오존 농도 |
| `no2Value` | ppm | 이산화질소 농도 |
| `pm10Value` | ㎍/㎥ | 미세먼지(PM10) 농도 |
| `pm10Value24` | ㎍/㎥ | 미세먼지 24시간 평균 |
| `pm25Value` | ㎍/㎥ | 초미세먼지(PM2.5) 농도 |
| `pm25Value24` | ㎍/㎥ | 초미세먼지 24시간 평균 |
| `khaiValue` | - | 통합대기환경지수 (CAI) |
| `khaiGrade` | 1~4 | CAI 등급 |

### 등급 코드 (Grade)

| Grade | Description | Color | CAI Range |
|-------|-------------|-------|-----------|
| `1` | 좋음 | 파랑 | 0~50 |
| `2` | 보통 | 초록 | 51~100 |
| `3` | 나쁨 | 노랑 | 101~250 |
| `4` | 매우나쁨 | 빨강 | 251~ |

---

## Air Quality Index Standards

### 통합대기환경지수 (CAI) 산정 기준

| Pollutant | Good (0-50) | Moderate (51-100) | Unhealthy (101-250) | Very Unhealthy (251+) |
|-----------|-------------|-------------------|---------------------|-----------------------|
| PM10 | 0-30 | 31-80 | 81-150 | 151+ (㎍/㎥) |
| PM2.5 | 0-15 | 16-35 | 36-75 | 76+ (㎍/㎥) |
| O3 | 0-0.030 | 0.031-0.090 | 0.091-0.150 | 0.151+ (ppm) |
| NO2 | 0-0.030 | 0.031-0.060 | 0.061-0.200 | 0.201+ (ppm) |
| CO | 0-2.0 | 2.1-9.0 | 9.1-15.0 | 15.1+ (ppm) |
| SO2 | 0-0.020 | 0.021-0.050 | 0.051-0.150 | 0.151+ (ppm) |

### WHO 권고 기준 (참고)

| Pollutant | Annual Mean | 24-hour Mean |
|-----------|-------------|--------------|
| PM2.5 | 5 ㎍/㎥ | 15 ㎍/㎥ |
| PM10 | 15 ㎍/㎥ | 45 ㎍/㎥ |
| O3 | - | 100 ㎍/㎥ (8-hour) |
| NO2 | 10 ㎍/㎥ | 25 ㎍/㎥ |

---

## Data Refresh Rate

| Data Type | Refresh | Caching |
|-----------|---------|---------|
| 실시간 측정 | 1시간 | 30분~1시간 |
| 24시간 평균 | 1시간 | 1시간 |
| 예보 정보 | 1일 4회 | 3~6시간 |

---

## Error Responses

| Code | Message | Description |
|------|---------|-------------|
| `00` | NORMAL_SERVICE | 정상 |
| `01` | APPLICATION_ERROR | 어플리케이션 에러 |
| `02` | DB_ERROR | 데이터베이스 에러 |
| `03` | NODATA_ERROR | 데이터 없음 |
| `04` | HTTP_ERROR | HTTP 에러 |
| `10` | INVALID_REQUEST_PARAMETER | 잘못된 요청 파라미터 |
| `22` | SERVICE_KEY_IS_NOT_REGISTERED | 미등록 서비스키 |

---

## Rate Limits

| Account Type | Daily Limit |
|--------------|-------------|
| Development | 1,000 calls |
| Production | 500,000 calls |

---

## Sample Request

```bash
curl "https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty?\
serviceKey=YOUR_KEY&\
returnType=json&\
numOfRows=100&\
pageNo=1&\
stationName=종로구&\
dataTerm=DAILY&\
ver=1.3"
```

---

## SDK Interface Design

```typescript
interface AirQualityAdapter {
  // 측정소별 실시간 데이터
  getRealtimeByStation(params: StationParams): Promise<AirQualityResponse>;

  // 시도별 실시간 데이터
  getRealtimeBySido(params: SidoParams): Promise<AirQualityResponse[]>;

  // 측정소 목록 조회
  getStationList(params: StationListParams): Promise<StationListResponse>;

  // 근접 측정소 조회
  getNearbyStations(params: CoordinateParams): Promise<StationListResponse>;

  // 나쁨 이상 측정소 목록
  getUnhealthyStations(): Promise<StationListResponse>;

  // 편의 메서드: 현재 대기질
  getCurrentAirQuality(location: string): Promise<AirQuality>;

  // 편의 메서드: 대기질 등급
  getAirQualityGrade(location: string): Promise<AirQualityGrade>;

  // 편의 메서드: 미세먼지 농도
  getPM(location: string): Promise<{ pm10: number; pm25: number }>;
}

interface StationParams {
  stationName: string;
  dataTerm?: 'DAILY' | 'MONTH' | '3MONTH';
  pageNo?: number;
  numOfRows?: number;
}

interface AirQuality {
  stationName: string;
  dataTime: string;
  pollutants: {
    so2: number;
    co: number;
    o3: number;
    no2: number;
    pm10: number;
    pm25: number;
  };
  cai: {
    value: number;
    grade: 1 | 2 | 3 | 4;
    gradeText: string;
  };
  grades: {
    so2: number;
    co: number;
    o3: number;
    no2: number;
    pm10: number;
    pm25: number;
  };
}

interface AirQualityGrade {
  overall: 'good' | 'moderate' | 'unhealthy' | 'veryUnhealthy';
  pm10: 'good' | 'moderate' | 'unhealthy' | 'veryUnhealthy';
  pm25: 'good' | 'moderate' | 'unhealthy' | 'veryUnhealthy';
  description: string;
  healthAdvice: string;
}
```

---

## Notes

1. **측정소명 정확성**: 측정소명은 정확히 일치해야 합니다 (예: "종로구", "강남구")
2. **좌표 변환 필요**: 근접 측정소 조회 시 TM 좌표계 사용 (WGS84 → TM 변환 필요)
3. **점검 시간**: 매일 00:00~01:00 데이터 갱신으로 인한 지연 가능
4. **결측 데이터**: 장비 점검 등으로 일부 항목이 `-` 또는 `null`일 수 있음
5. **예보 연계**: 대기질 예보는 별도 API (대기오염예보통보조회서비스) 사용

---

## Related APIs

| API | Description |
|-----|-------------|
| 대기오염예보통보조회서비스 | 대기질 예보 정보 |
| 황사정보조회서비스 | 황사 정보 |
| 자외선지수조회서비스 | UV 지수 정보 |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.3 | Current | 현재 버전 |
| 1.0 | Legacy | 구버전 |
