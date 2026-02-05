# Real Estate API Specification

부동산 실거래가 정보 조회 서비스 API 스펙 문서

> **Source**: https://www.data.go.kr/data/15057511/openapi.do
> **Provider**: 국토교통부 (Ministry of Land, Infrastructure and Transport)
> **Last Updated**: 2026-02-05

---

## Overview

| Item | Value |
|------|-------|
| **Service Name** | 국토교통부 실거래가 정보 조회 서비스 |
| **Base URL** | `https://apis.data.go.kr/1613000` |
| **Protocol** | REST API (HTTP GET) |
| **Response Format** | XML, JSON |
| **Authentication** | Service Key (Query Parameter) |

---

## Available Services

| Service | Description | Endpoint Base |
|---------|-------------|---------------|
| 아파트매매 | 아파트 매매 실거래 | `/RTMSDataSvcAptTradeDev` |
| 아파트전월세 | 아파트 전월세 실거래 | `/RTMSDataSvcAptRent` |
| 연립다세대매매 | 연립다세대 매매 실거래 | `/RTMSDataSvcRHRent` |
| 연립다세대전월세 | 연립다세대 전월세 실거래 | `/RTMSDataSvcRHRent` |
| 단독다가구매매 | 단독/다가구 매매 실거래 | `/RTMSDataSvcSHTrade` |
| 오피스텔매매 | 오피스텔 매매 실거래 | `/RTMSDataSvcOffiTrade` |
| 토지매매 | 토지 매매 실거래 | `/RTMSDataSvcLandTrade` |
| 상업업무용매매 | 상업/업무용 부동산 매매 | `/RTMSDataSvcNrgTrade` |

---

## Endpoints

### 1. 아파트 매매 실거래 조회

| Item | Value |
|------|-------|
| **Endpoint** | `/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev` |
| **Method** | GET |
| **Description** | 아파트 매매 실거래 상세 자료 조회 |

#### Request Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `serviceKey` | String | ✅ | 인증키 | `AbCdEf...` |
| `LAWD_CD` | String | ✅ | 지역코드 (법정동 5자리) | `11110` |
| `DEAL_YMD` | String | ✅ | 계약년월 (YYYYMM) | `202601` |
| `pageNo` | Integer | ❌ | 페이지 번호 | `1` |
| `numOfRows` | Integer | ❌ | 결과 수 | `100` |

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
            "거래금액": "180,000",
            "거래유형": "중개거래",
            "건축년도": 2015,
            "년": 2026,
            "법정동": "사직동",
            "아파트": "광화문스페이스본",
            "월": 1,
            "일": 15,
            "전용면적": 84.95,
            "중개사소재지": "서울 종로구",
            "지번": "9",
            "지역코드": "11110",
            "층": 15,
            "해제사유발생일": "",
            "해제여부": ""
          }
        ]
      },
      "numOfRows": 100,
      "pageNo": 1,
      "totalCount": 45
    }
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `거래금액` | String | 거래 금액 (만원, 천 단위 콤마) |
| `거래유형` | String | 거래 유형 (중개거래, 직거래) |
| `건축년도` | Integer | 건축 연도 |
| `년` | Integer | 계약 연도 |
| `월` | Integer | 계약 월 |
| `일` | Integer | 계약 일 |
| `법정동` | String | 법정동명 |
| `아파트` | String | 아파트명 |
| `전용면적` | Float | 전용면적 (㎡) |
| `층` | Integer | 층수 |
| `지번` | String | 지번 |
| `지역코드` | String | 법정동 코드 |
| `해제여부` | String | 계약 해제 여부 (O: 해제) |
| `해제사유발생일` | String | 해제 사유 발생일 |

---

### 2. 아파트 전월세 실거래 조회

| Item | Value |
|------|-------|
| **Endpoint** | `/RTMSDataSvcAptRent/getRTMSDataSvcAptRent` |
| **Method** | GET |
| **Description** | 아파트 전월세 실거래 자료 조회 |

#### Additional Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `보증금` | String | 보증금 (만원) |
| `월세` | String | 월세 (만원, 전세는 0) |
| `계약구분` | String | 신규/갱신 |
| `계약기간` | String | 계약 기간 |

---

### 3. 단독/다가구 매매 실거래 조회

| Item | Value |
|------|-------|
| **Endpoint** | `/RTMSDataSvcSHTrade/getRTMSDataSvcSHTrade` |
| **Method** | GET |
| **Description** | 단독/다가구 매매 실거래 자료 조회 |

#### Additional Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `대지면적` | Float | 대지면적 (㎡) |
| `연면적` | Float | 연면적 (㎡) |
| `주택유형` | String | 단독, 다가구 등 |

---

### 4. 오피스텔 매매 실거래 조회

| Item | Value |
|------|-------|
| **Endpoint** | `/RTMSDataSvcOffiTrade/getRTMSDataSvcOffiTrade` |
| **Method** | GET |
| **Description** | 오피스텔 매매 실거래 자료 조회 |

---

### 5. 토지 매매 실거래 조회

| Item | Value |
|------|-------|
| **Endpoint** | `/RTMSDataSvcLandTrade/getRTMSDataSvcLandTrade` |
| **Method** | GET |
| **Description** | 토지 매매 실거래 자료 조회 |

#### Additional Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `지목` | String | 지목 (대, 전, 답 등) |
| `거래면적` | Float | 거래면적 (㎡) |
| `용도지역` | String | 용도지역 |

---

## Code Tables

### 지역코드 (LAWD_CD) - 서울 주요 구

| Code | District | Code | District |
|------|----------|------|----------|
| `11110` | 종로구 | `11140` | 중구 |
| `11170` | 용산구 | `11200` | 성동구 |
| `11215` | 광진구 | `11230` | 동대문구 |
| `11260` | 중랑구 | `11290` | 성북구 |
| `11305` | 강북구 | `11320` | 도봉구 |
| `11350` | 노원구 | `11380` | 은평구 |
| `11410` | 서대문구 | `11440` | 마포구 |
| `11470` | 양천구 | `11500` | 강서구 |
| `11530` | 구로구 | `11545` | 금천구 |
| `11560` | 영등포구 | `11590` | 동작구 |
| `11620` | 관악구 | `11650` | 서초구 |
| `11680` | 강남구 | `11710` | 송파구 |
| `11740` | 강동구 | | |

### 지역코드 - 광역시/도

| Code | Region | Code | Region |
|------|--------|------|--------|
| `11` | 서울특별시 | `26` | 부산광역시 |
| `27` | 대구광역시 | `28` | 인천광역시 |
| `29` | 광주광역시 | `30` | 대전광역시 |
| `31` | 울산광역시 | `36` | 세종특별자치시 |
| `41` | 경기도 | `42` | 강원도 |
| `43` | 충청북도 | `44` | 충청남도 |
| `45` | 전라북도 | `46` | 전라남도 |
| `47` | 경상북도 | `48` | 경상남도 |
| `50` | 제주특별자치도 | | |

### 거래유형

| Type | Description |
|------|-------------|
| `중개거래` | 부동산 중개업소를 통한 거래 |
| `직거래` | 당사자 간 직접 거래 |

---

## Data Update Schedule

| Update Type | Frequency | Description |
|-------------|-----------|-------------|
| 신규 등록 | 매일 | 신고된 거래 등록 |
| 해제 반영 | 매일 | 계약 해제 정보 반영 |
| 정정 반영 | 수시 | 신고 내용 정정 |

---

## Data Characteristics

### 데이터 범위

- **시작일**: 2006년 1월부터 데이터 제공
- **지연**: 실거래 신고 후 15일 이내 공개
- **해제 정보**: 2017년 이후 계약 해제 정보 포함

### 금액 표시

- 단위: 만원
- 형식: 천 단위 콤마 포함 문자열 (예: "180,000")
- 파싱 필요: 숫자 연산 시 콤마 제거 필요

---

## Error Responses

| Code | Message | Description |
|------|---------|-------------|
| `00` | NORMAL_SERVICE | 정상 |
| `01` | APPLICATION_ERROR | 어플리케이션 에러 |
| `02` | DB_ERROR | 데이터베이스 에러 |
| `03` | NODATA_ERROR | 데이터 없음 |
| `10` | INVALID_REQUEST_PARAMETER_ERROR | 잘못된 요청 파라미터 |
| `22` | SERVICE_KEY_IS_NOT_REGISTERED | 미등록 서비스키 |

---

## Rate Limits

| Account Type | Daily Limit |
|--------------|-------------|
| Development | 1,000 calls |
| Production | 100,000 calls |

---

## Sample Request

```bash
curl "https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev?\
serviceKey=YOUR_KEY&\
LAWD_CD=11680&\
DEAL_YMD=202601&\
pageNo=1&\
numOfRows=100"
```

---

## SDK Interface Design

```typescript
interface RealEstateAdapter {
  // 아파트 매매
  getApartmentTrades(params: TradeParams): Promise<TradeResponse>;

  // 아파트 전월세
  getApartmentRentals(params: RentalParams): Promise<RentalResponse>;

  // 연립다세대 매매
  getRowHouseTrades(params: TradeParams): Promise<TradeResponse>;

  // 연립다세대 전월세
  getRowHouseRentals(params: RentalParams): Promise<RentalResponse>;

  // 단독/다가구 매매
  getDetachedHouseTrades(params: TradeParams): Promise<TradeResponse>;

  // 오피스텔 매매
  getOfficetelTrades(params: TradeParams): Promise<TradeResponse>;

  // 오피스텔 전월세
  getOfficetelRentals(params: RentalParams): Promise<RentalResponse>;

  // 토지 매매
  getLandTrades(params: TradeParams): Promise<LandTradeResponse>;

  // 상업/업무용 매매
  getCommercialTrades(params: TradeParams): Promise<TradeResponse>;

  // 편의 메서드: 특정 아파트 거래 내역
  getTradesByApartment(params: ApartmentSearchParams): Promise<TradeHistory[]>;

  // 편의 메서드: 지역 평균 시세
  getAveragePrice(params: AreaPriceParams): Promise<PriceStatistics>;

  // 편의 메서드: 가격 추이
  getPriceTrend(params: TrendParams): Promise<PriceTrend[]>;
}

interface TradeParams {
  regionCode: string;      // 법정동 5자리
  dealYearMonth: string;   // YYYYMM
  pageNo?: number;
  numOfRows?: number;
}

interface RentalParams extends TradeParams {
  rentalType?: 'all' | 'jeonse' | 'wolse';
}

interface TradeRecord {
  apartmentName: string;
  district: string;
  address: string;
  price: number;           // 만원 (숫자로 변환)
  priceFormatted: string;  // "18억" 형태
  area: number;            // 전용면적 ㎡
  areaPyeong: number;      // 평수
  floor: number;
  buildYear: number;
  dealDate: string;        // YYYY-MM-DD
  dealType: 'direct' | 'agency';
  isCanceled: boolean;
  cancelDate?: string;
}

interface RentalRecord {
  apartmentName: string;
  district: string;
  deposit: number;         // 보증금 (만원)
  monthlyRent: number;     // 월세 (만원, 전세는 0)
  rentalType: 'jeonse' | 'wolse';
  area: number;
  floor: number;
  contractType: 'new' | 'renewal';
  contractPeriod: string;
}

interface PriceStatistics {
  regionCode: string;
  regionName: string;
  period: string;
  averagePrice: number;
  medianPrice: number;
  minPrice: number;
  maxPrice: number;
  transactionCount: number;
  pricePerPyeong: number;
}
```

---

## Data Processing Notes

### 금액 파싱

```typescript
// 거래금액 문자열 → 숫자 변환
function parsePrice(priceStr: string): number {
  return parseInt(priceStr.replace(/,/g, ''), 10);
}

// 억/만원 표시 변환
function formatPrice(price: number): string {
  if (price >= 10000) {
    const eok = Math.floor(price / 10000);
    const man = price % 10000;
    return man > 0 ? `${eok}억 ${man}만원` : `${eok}억`;
  }
  return `${price}만원`;
}
```

### 면적 변환

```typescript
// ㎡ → 평 변환 (1평 ≈ 3.3058㎡)
function sqmToPyeong(sqm: number): number {
  return Math.round(sqm / 3.3058 * 10) / 10;
}
```

---

## Notes

1. **신고 지연**: 실거래 신고 기한은 계약일로부터 30일 이내이므로 최신 데이터에 지연이 있음
2. **해제 데이터**: 계약 해제된 거래도 포함되므로 `해제여부` 필드 확인 필요
3. **중복 거래**: 동일 물건이 여러 번 거래될 수 있음
4. **금액 정확성**: 실거래 신고가이므로 신뢰도 높음
5. **캐싱 권장**: 과거 데이터는 변경되지 않으므로 장기 캐싱 가능 (당월 제외)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| Current | 2026 | 현재 버전 (상세 자료 포함) |
| Legacy | - | 구버전 (간략 자료) |
