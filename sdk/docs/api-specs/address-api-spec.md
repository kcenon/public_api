# Address API Specification

도로명주소 조회 서비스 API 스펙 문서

> **Source**: https://www.data.go.kr/data/15000124/openapi.do
> **Provider**: 행정안전부 / 우정사업본부
> **Portal**: https://www.juso.go.kr/
> **Last Updated**: 2026-02-05

---

## Overview

| Item | Value |
|------|-------|
| **Service Name** | 도로명주소 조회 서비스 |
| **Base URL** | `https://business.juso.go.kr/addrlink` |
| **Protocol** | REST API (HTTP GET) |
| **Response Format** | XML, JSON |
| **Authentication** | API Key (confmKey) |

---

## Endpoints

### 1. 도로명주소 검색 (addrLinkApi)

| Item | Value |
|------|-------|
| **Endpoint** | `/addrLinkApi.do` |
| **Method** | GET |
| **Description** | 키워드로 도로명주소 검색 |

#### Request Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `confmKey` | String | ✅ | 승인키 | `devU01...` |
| `currentPage` | Integer | ❌ | 현재 페이지 (기본: 1) | `1` |
| `countPerPage` | Integer | ❌ | 페이지당 출력 개수 (기본: 10, 최대: 100) | `10` |
| `keyword` | String | ✅ | 검색 키워드 | `세종대로 110` |
| `resultType` | String | ❌ | 응답 형식 (xml/json) | `json` |
| `hstryYn` | String | ❌ | 변동이력 포함 여부 (Y/N) | `N` |
| `firstSort` | String | ❌ | 정렬 (none/road/location) | `none` |
| `addInfoYn` | String | ❌ | 출력 결과 추가 여부 (Y/N) | `Y` |

#### Response Structure (JSON)

```json
{
  "results": {
    "common": {
      "totalCount": "23",
      "currentPage": "1",
      "countPerPage": "10",
      "errorCode": "0",
      "errorMessage": "정상"
    },
    "juso": [
      {
        "roadAddr": "서울특별시 중구 세종대로 110 (태평로1가)",
        "roadAddrPart1": "서울특별시 중구 세종대로 110",
        "roadAddrPart2": "(태평로1가)",
        "jibunAddr": "서울특별시 중구 태평로1가 31",
        "engAddr": "110, Sejong-daero, Jung-gu, Seoul",
        "zipNo": "04524",
        "admCd": "1114011100",
        "rnMgtSn": "111403100009",
        "bdMgtSn": "1114011100103140001000001",
        "detBdNmList": "서울특별시청",
        "bdNm": "서울특별시청",
        "bdKdcd": "0",
        "siNm": "서울특별시",
        "sggNm": "중구",
        "emdNm": "태평로1가",
        "liNm": "",
        "rn": "세종대로",
        "udrtYn": "0",
        "buldMnnm": "110",
        "buldSlno": "0",
        "mtYn": "0",
        "lnbrMnnm": "31",
        "lnbrSlno": "0",
        "emdNo": "01",
        "hstryYn": "0",
        "relJibun": "",
        "hemdNm": "소공동"
      }
    ]
  }
}
```

#### Response Fields

| Field | Description |
|-------|-------------|
| `roadAddr` | 전체 도로명주소 |
| `roadAddrPart1` | 도로명주소 (참고항목 제외) |
| `roadAddrPart2` | 도로명주소 참고항목 |
| `jibunAddr` | 지번주소 |
| `engAddr` | 도로명주소 (영문) |
| `zipNo` | 우편번호 |
| `admCd` | 행정구역코드 |
| `rnMgtSn` | 도로명코드 |
| `bdMgtSn` | 건물관리번호 |
| `bdNm` | 건물명 |
| `siNm` | 시도명 |
| `sggNm` | 시군구명 |
| `emdNm` | 읍면동명 |
| `rn` | 도로명 |
| `buldMnnm` | 건물본번 |
| `buldSlno` | 건물부번 |

---

### 2. 좌표 검색 (coordApi)

| Item | Value |
|------|-------|
| **Endpoint** | `/coordApi.do` |
| **Method** | GET |
| **Description** | 주소로 좌표 검색 |

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `confmKey` | String | ✅ | 승인키 |
| `admCd` | String | ✅ | 행정구역코드 |
| `rnMgtSn` | String | ✅ | 도로명코드 |
| `udrtYn` | String | ✅ | 지하여부 (0/1) |
| `buldMnnm` | String | ✅ | 건물본번 |
| `buldSlno` | String | ✅ | 건물부번 |
| `resultType` | String | ❌ | 응답 형식 |

#### Response Structure

```json
{
  "results": {
    "common": {
      "errorCode": "0",
      "errorMessage": "정상"
    },
    "juso": [
      {
        "admCd": "1114011100",
        "rnMgtSn": "111403100009",
        "bdMgtSn": "1114011100103140001000001",
        "udrtYn": "0",
        "buldMnnm": "110",
        "buldSlno": "0",
        "entX": "198081.1",
        "entY": "451136.7",
        "bdNm": "서울특별시청"
      }
    ]
  }
}
```

---

### 3. 영문주소 검색 (engApi)

| Item | Value |
|------|-------|
| **Endpoint** | `/addrEngApi.do` |
| **Method** | GET |
| **Description** | 영문 주소 검색 |

#### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `confmKey` | String | ✅ | 승인키 |
| `keyword` | String | ✅ | 검색 키워드 (한글 또는 영문) |
| `resultType` | String | ❌ | 응답 형식 |
| `currentPage` | Integer | ❌ | 페이지 번호 |
| `countPerPage` | Integer | ❌ | 페이지당 개수 |

---

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| `0` | 정상 | 정상 처리 |
| `-999` | 시스템에러 | 시스템 내부 오류 |
| `E0001` | 승인되지 않은 KEY입니다 | 유효하지 않은 API 키 |
| `E0005` | 검색어가 없습니다 | keyword 파라미터 누락 |
| `E0006` | 주소를 상세히 입력해 주시기 바랍니다 | 검색어가 너무 짧음 |
| `E0008` | 검색어에 사용할 수 없는 문자열입니다 | 특수문자 등 |
| `E0010` | 요청변수 오류 | 잘못된 파라미터 |
| `E0011` | confmKey 오류 | 승인키 오류 |
| `E0012` | 통합검색어 입력 요청 | 검색어 형식 오류 |
| `E0014` | 일일 허용 횟수 초과 | API 호출 제한 초과 |

---

## Search Tips

### 효과적인 검색어

| Good | Bad |
|------|-----|
| `세종대로 110` | `세종` |
| `강남구 테헤란로 152` | `테헤란로` |
| `서울시청` | `시청` |

### 검색어 규칙

1. **최소 2단어** 이상 입력 권장
2. **도로명 + 건물번호** 형식이 가장 정확
3. **건물명**으로도 검색 가능
4. **시도명** 생략 가능

---

## Rate Limits

| Item | Limit |
|------|-------|
| 일일 호출 | 무제한 (단, 과도한 호출 시 제한) |
| 초당 호출 | 권장 10회 미만 |

---

## Sample Request

```bash
curl "https://business.juso.go.kr/addrlink/addrLinkApi.do?\
confmKey=YOUR_API_KEY&\
currentPage=1&\
countPerPage=10&\
keyword=세종대로 110&\
resultType=json"
```

---

## SDK Interface Design

```typescript
interface AddressAdapter {
  // 주소 검색
  search(params: SearchParams): Promise<SearchResponse>;

  // 좌표 검색
  getCoordinates(params: CoordParams): Promise<CoordResponse>;

  // 영문주소 검색
  searchEnglish(params: SearchParams): Promise<EnglishAddressResponse>;

  // 편의 메서드: 우편번호 검색
  getZipCode(address: string): Promise<string>;

  // 편의 메서드: 주소 정규화
  normalize(address: string): Promise<NormalizedAddress>;
}

interface SearchParams {
  keyword: string;
  page?: number;
  pageSize?: number;
  includeHistory?: boolean;
  sort?: 'none' | 'road' | 'location';
}

interface AddressResult {
  roadAddress: string;
  jibunAddress: string;
  englishAddress: string;
  zipCode: string;
  buildingName?: string;
  coordinates?: {
    x: number;
    y: number;
  };
  district: {
    sido: string;
    sigungu: string;
    dong: string;
  };
}
```

---

## Notes

1. **승인키 발급**: juso.go.kr에서 별도 발급 필요
2. **검색어 제한**: 최소 2글자, 특수문자 제한
3. **좌표계**: 중부원점 TM 좌표계 사용 (EPSG:2097)
4. **캐싱**: 주소 데이터는 안정적이므로 장기 캐싱(7일) 권장

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| Current | 2026 | 현재 버전 |
