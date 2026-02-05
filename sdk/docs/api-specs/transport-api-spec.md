# Transport API Specification

대중교통 정보 조회 서비스 API 스펙 문서

> **Source**: https://www.data.go.kr/data/15080346/openapi.do
> **Provider**: 국토교통부 / 한국교통안전공단
> **Last Updated**: 2026-02-05

---

## Overview

| Item | Value |
|------|-------|
| **Service Name** | 국토교통부 대중교통정보 통합서비스 |
| **Base URL** | `https://apis.data.go.kr/1613000` |
| **Protocol** | REST API (HTTP GET) |
| **Response Format** | XML, JSON |
| **Authentication** | Service Key (Query Parameter) |

---

## Available Services

| Service | Endpoint Base | Description |
|---------|---------------|-------------|
| 버스도착정보 | `/ArvlInfoInqireService` | 버스 도착 예정 정보 |
| 버스위치정보 | `/BusLcInfoInqireService` | 실시간 버스 위치 |
| 버스노선정보 | `/BusRouteInfoInqireService` | 버스 노선 정보 |
| 버스정류소정보 | `/BusSttnInfoInqireService` | 버스 정류장 정보 |
| 지하철역정보 | `/SubwaySttnInfoInqireService` | 지하철역 정보 |
| 열차정보 | `/TrainInfoService` | KTX/SRT 열차 정보 |

---

## Endpoints

### 1. 버스 도착 정보 조회

| Item | Value |
|------|-------|
| **Endpoint** | `/ArvlInfoInqireService/getSttnAcctoArvlPrearngeInfoList` |
| **Method** | GET |
| **Description** | 정류소별 버스 도착 예정 정보 조회 |

#### Request Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `serviceKey` | String | ✅ | 인증키 | `AbCdEf...` |
| `cityCode` | Integer | ✅ | 도시코드 | `11` (서울) |
| `nodeId` | String | ✅ | 정류소 ID | `ICB164000395` |
| `pageNo` | Integer | ❌ | 페이지 번호 | `1` |
| `numOfRows` | Integer | ❌ | 결과 수 | `10` |

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
            "arrprevstationcnt": 3,
            "arrtime": 180,
            "nodeid": "ICB164000395",
            "nodenm": "인천시청",
            "routeid": "ICB165000012",
            "routeno": "12",
            "routetp": "일반버스",
            "vehicletp": "저상버스"
          }
        ]
      },
      "numOfRows": 10,
      "pageNo": 1,
      "totalCount": 5
    }
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `arrprevstationcnt` | Integer | 남은 정류장 수 |
| `arrtime` | Integer | 도착 예정 시간 (초) |
| `nodeid` | String | 정류소 ID |
| `nodenm` | String | 정류소명 |
| `routeid` | String | 노선 ID |
| `routeno` | String | 노선 번호 |
| `routetp` | String | 노선 유형 |
| `vehicletp` | String | 차량 유형 |

---

### 2. 버스 노선 정보 조회

| Item | Value |
|------|-------|
| **Endpoint** | `/BusRouteInfoInqireService/getRouteInfoIem` |
| **Method** | GET |
| **Description** | 노선 기본 정보 조회 |

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `serviceKey` | String | ✅ | 인증키 |
| `cityCode` | Integer | ✅ | 도시코드 |
| `routeId` | String | ✅ | 노선 ID |

---

### 3. 버스 정류소 목록 조회

| Item | Value |
|------|-------|
| **Endpoint** | `/BusSttnInfoInqireService/getSttnNoList` |
| **Method** | GET |
| **Description** | 정류소 목록 검색 |

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `serviceKey` | String | ✅ | 인증키 |
| `cityCode` | Integer | ✅ | 도시코드 |
| `nodeNm` | String | ❌ | 정류소명 검색어 |

---

### 4. 지하철역 정보 조회

| Item | Value |
|------|-------|
| **Endpoint** | `/SubwaySttnInfoInqireService/getKwrdFndSubwaySttnList` |
| **Method** | GET |
| **Description** | 지하철역 정보 검색 |

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `serviceKey` | String | ✅ | 인증키 |
| `subwayStationName` | String | ✅ | 역명 검색어 |

---

## Code Tables

### 도시코드 (cityCode)

| Code | City | Code | City |
|------|------|------|------|
| `11` | 서울 | `21` | 부산 |
| `22` | 대구 | `23` | 인천 |
| `24` | 광주 | `25` | 대전 |
| `26` | 울산 | `31` | 경기 |
| `32` | 강원 | `33` | 충북 |
| `34` | 충남 | `35` | 전북 |
| `36` | 전남 | `37` | 경북 |
| `38` | 경남 | `39` | 제주 |
| `41` | 세종 | | |

### 노선 유형 (routetp)

| Type | Description |
|------|-------------|
| `일반버스` | 일반 시내버스 |
| `좌석버스` | 좌석 시내버스 |
| `직행좌석버스` | 직행좌석버스 |
| `광역버스` | 광역버스 |
| `급행버스` | 급행버스 |
| `마을버스` | 마을버스 |
| `공항버스` | 공항버스 |

### 지하철 노선

| Code | Line | City |
|------|------|------|
| `1` | 1호선 | 서울/수도권 |
| `2` | 2호선 | 서울 |
| `3` | 3호선 | 서울 |
| `4` | 4호선 | 서울 |
| `5` | 5호선 | 서울 |
| `6` | 6호선 | 서울 |
| `7` | 7호선 | 서울 |
| `8` | 8호선 | 서울 |
| `9` | 9호선 | 서울 |
| `K` | 경의중앙선 | 수도권 |
| `B` | 분당선 | 수도권 |
| `S` | 신분당선 | 수도권 |

---

## Real-time Data Considerations

### 데이터 갱신 주기

| Data Type | Refresh Rate | Caching Recommendation |
|-----------|--------------|------------------------|
| 버스 도착 정보 | 30초 | 30초 이하 |
| 버스 위치 정보 | 10~30초 | 캐싱 비권장 |
| 노선 정보 | 1일 | 24시간 |
| 정류장 정보 | 1주 | 7일 |

### 실시간 데이터 주의사항

1. **도착 시간 정확도**: 교통 상황에 따라 실제와 차이 발생 가능
2. **위치 정보 지연**: GPS 수신 상태에 따라 지연 발생
3. **운행 종료 시간**: 심야 시간대 데이터 미제공

---

## Error Responses

| Code | Message | Description |
|------|---------|-------------|
| `00` | NORMAL_SERVICE | 정상 |
| `01` | APPLICATION_ERROR | 어플리케이션 에러 |
| `02` | DB_ERROR | 데이터베이스 에러 |
| `03` | NODATA_ERROR | 데이터 없음 |
| `04` | HTTP_ERROR | HTTP 에러 |
| `20` | SERVICE_ACCESS_DENIED | 서비스 접근 거부 |
| `22` | SERVICE_KEY_IS_NOT_REGISTERED | 등록되지 않은 서비스키 |

---

## Rate Limits

| Account Type | Daily Limit |
|--------------|-------------|
| Development | 1,000 calls |
| Production | 100,000+ calls |

---

## Sample Requests

### 버스 도착 정보

```bash
curl "https://apis.data.go.kr/1613000/ArvlInfoInqireService/getSttnAcctoArvlPrearngeInfoList?\
serviceKey=YOUR_KEY&\
cityCode=11&\
nodeId=ICB164000395&\
_type=json"
```

### 정류소 검색

```bash
curl "https://apis.data.go.kr/1613000/BusSttnInfoInqireService/getSttnNoList?\
serviceKey=YOUR_KEY&\
cityCode=11&\
nodeNm=시청&\
_type=json"
```

---

## SDK Interface Design

```typescript
interface TransportAdapter {
  // 버스 도착 정보
  getBusArrival(params: BusArrivalParams): Promise<BusArrivalResponse>;

  // 버스 위치 정보
  getBusLocation(params: BusLocationParams): Promise<BusLocationResponse>;

  // 버스 노선 정보
  getRouteInfo(params: RouteInfoParams): Promise<RouteInfoResponse>;

  // 버스 노선 검색
  searchRoutes(params: RouteSearchParams): Promise<RouteSearchResponse>;

  // 정류소 정보
  getStationInfo(params: StationInfoParams): Promise<StationInfoResponse>;

  // 정류소 검색
  searchStations(params: StationSearchParams): Promise<StationSearchResponse>;

  // 지하철역 검색
  searchSubwayStations(params: SubwaySearchParams): Promise<SubwayStationResponse>;

  // 편의 메서드: 주변 정류소
  getNearbyStations(lat: number, lng: number, radius?: number): Promise<Station[]>;

  // 편의 메서드: 실시간 도착 정보 (간편)
  getNextBus(stationId: string): Promise<BusArrival[]>;
}

interface BusArrivalParams {
  cityCode: number;
  stationId: string;
  routeId?: string;
}

interface BusArrival {
  routeNumber: string;
  routeType: string;
  arrivalTime: number;        // seconds
  stationsAway: number;
  vehicleType: string;
  isLowFloor: boolean;
}

interface Station {
  id: string;
  name: string;
  cityCode: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface RouteInfo {
  id: string;
  number: string;
  type: string;
  startStation: string;
  endStation: string;
  firstBusTime: string;
  lastBusTime: string;
  interval: number;           // minutes
}
```

---

## Regional API Differences

### 서울특별시 전용 API

서울시는 자체 Open API를 별도 제공합니다:

| Service | URL |
|---------|-----|
| 서울시 버스 | `http://ws.bus.go.kr/api/rest` |
| 서울시 지하철 | `http://swopenAPI.seoul.go.kr/api/subway` |

### 수도권 통합 API (TOPIS)

수도권 통합 정보:
- URL: `https://topis.seoul.go.kr`

---

## Notes

1. **실시간 특성**: 대중교통 데이터는 실시간 특성이 강하므로 캐싱에 주의
2. **도시별 차이**: 도시마다 지원하는 데이터 범위가 다름
3. **야간 운행**: 심야 시간대(00:00~05:00)에는 데이터가 부정확할 수 있음
4. **정류소 ID 체계**: 도시마다 정류소 ID 체계가 다름

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| Current | 2026 | 현재 버전 |
