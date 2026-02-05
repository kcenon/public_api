# Business Registration API Specification

국세청 사업자등록정보 진위확인 및 상태조회 서비스 API 스펙 문서

> **Source**: https://www.data.go.kr/data/15081808/openapi.do
> **Provider**: 국세청 (National Tax Service)
> **Last Updated**: 2026-02-05

---

## Overview

| Item | Value |
|------|-------|
| **Service Name** | 사업자등록정보 진위확인 및 상태조회 서비스 |
| **Base URL** | `https://api.odcloud.kr/api/nts-businessman/v1` |
| **Protocol** | REST API (HTTP POST) |
| **Response Format** | JSON |
| **Authentication** | Service Key (Query Parameter) |
| **Daily Limit** | 1,000,000 calls |

---

## Endpoints

### 1. 사업자등록 상태조회 (status)

| Item | Value |
|------|-------|
| **Endpoint** | `/status` |
| **Method** | POST |
| **Content-Type** | application/json |
| **Description** | 사업자등록번호로 사업자 상태 조회 |

#### Request Parameters (Query String)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `serviceKey` | String | ✅ | 인증키 (Decoded) |

#### Request Body (JSON)

```json
{
  "b_no": ["1234567890", "0987654321"]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `b_no` | String[] | ✅ | 사업자등록번호 배열 (최대 100개) |

#### Response Structure

```json
{
  "status_code": "OK",
  "match_cnt": 2,
  "request_cnt": 2,
  "data": [
    {
      "b_no": "1234567890",
      "b_stt": "계속사업자",
      "b_stt_cd": "01",
      "tax_type": "부가가치세 일반과세자",
      "tax_type_cd": "01",
      "end_dt": "",
      "utcc_yn": "N",
      "tax_type_change_dt": "",
      "invoice_apply_dt": "",
      "rbf_tax_type": "",
      "rbf_tax_type_cd": ""
    }
  ]
}
```

#### Response Fields

| Field | Description |
|-------|-------------|
| `b_no` | 사업자등록번호 |
| `b_stt` | 납세자상태 (명칭) |
| `b_stt_cd` | 납세자상태코드 |
| `tax_type` | 과세유형 (명칭) |
| `tax_type_cd` | 과세유형코드 |
| `end_dt` | 폐업일 (YYYYMMDD) |
| `utcc_yn` | 단위과세전환폐업여부 |
| `tax_type_change_dt` | 최근과세유형전환일자 |
| `invoice_apply_dt` | 세금계산서적용일자 |

---

### 2. 사업자등록 진위확인 (validate)

| Item | Value |
|------|-------|
| **Endpoint** | `/validate` |
| **Method** | POST |
| **Content-Type** | application/json |
| **Description** | 사업자등록정보 진위 확인 |

#### Request Body (JSON)

```json
{
  "businesses": [
    {
      "b_no": "1234567890",
      "start_dt": "20200101",
      "p_nm": "홍길동",
      "p_nm2": "",
      "b_nm": "(주)테스트",
      "corp_no": "",
      "b_sector": "",
      "b_type": "",
      "b_adr": ""
    }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `b_no` | String | ✅ | 사업자등록번호 (10자리) |
| `start_dt` | String | ✅ | 개업일자 (YYYYMMDD) |
| `p_nm` | String | ✅ | 대표자성명 |
| `p_nm2` | String | ❌ | 대표자성명2 |
| `b_nm` | String | ❌ | 상호 |
| `corp_no` | String | ❌ | 법인등록번호 |
| `b_sector` | String | ❌ | 주업태명 |
| `b_type` | String | ❌ | 주종목명 |
| `b_adr` | String | ❌ | 사업장주소 |

#### Response Structure

```json
{
  "status_code": "OK",
  "valid_cnt": 1,
  "request_cnt": 1,
  "data": [
    {
      "b_no": "1234567890",
      "valid": "01",
      "valid_msg": "확인되었습니다.",
      "request_param": {
        "b_no": "1234567890",
        "start_dt": "20200101",
        "p_nm": "홍길동"
      },
      "status": {
        "b_no": "1234567890",
        "b_stt": "계속사업자",
        "b_stt_cd": "01",
        "tax_type": "부가가치세 일반과세자",
        "tax_type_cd": "01",
        "end_dt": ""
      }
    }
  ]
}
```

#### Validation Codes

| Code | Description |
|------|-------------|
| `01` | 일치 (확인됨) |
| `02` | 불일치 |

---

## Code Tables

### 납세자상태코드 (b_stt_cd)

| Code | Description |
|------|-------------|
| `01` | 계속사업자 |
| `02` | 휴업자 |
| `03` | 폐업자 |

### 과세유형코드 (tax_type_cd)

| Code | Description |
|------|-------------|
| `01` | 부가가치세 일반과세자 |
| `02` | 부가가치세 간이과세자 |
| `03` | 부가가치세 면세사업자 |
| `04` | 비영리법인 또는 단체 |
| `05` | 부가가치세 과세특례자 |
| `06` | 부가가치세 간이과세자 (세금계산서발급사업자) |
| `07` | 고유번호가 부여된 단체 |

---

## Business Number Format

### 구조

```
XXX-XX-XXXXX
 │   │    │
 │   │    └─ 일련번호 (5자리)
 │   └────── 개인/법인 구분 (2자리)
 └────────── 지방청/세무서 코드 (3자리)
```

### 검증 알고리즘 (Checksum)

```javascript
function validateBusinessNumber(bizNo) {
  const cleanNo = bizNo.replace(/[^0-9]/g, '');
  if (cleanNo.length !== 10) return false;

  const weights = [1, 3, 7, 1, 3, 7, 1, 3, 5];
  let sum = 0;

  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanNo[i]) * weights[i];
  }

  sum += Math.floor((parseInt(cleanNo[8]) * 5) / 10);
  const checkDigit = (10 - (sum % 10)) % 10;

  return checkDigit === parseInt(cleanNo[9]);
}
```

---

## Error Responses

### Common Error Response

```json
{
  "status_code": "ERROR",
  "msg": "Invalid request"
}
```

### API Gateway Error (XML)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<OpenAPI_ServiceResponse>
  <cmmMsgHeader>
    <errMsg>SERVICE_KEY_IS_NOT_REGISTERED_ERROR</errMsg>
    <returnReasonCode>22</returnReasonCode>
  </cmmMsgHeader>
</OpenAPI_ServiceResponse>
```

---

## Rate Limits

| Metric | Limit |
|--------|-------|
| Requests per call | 최대 100건 |
| Daily calls | 1,000,000건 |

---

## Sample Requests

### 상태조회

```bash
curl -X POST "https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"b_no": ["1234567890"]}'
```

### 진위확인

```bash
curl -X POST "https://api.odcloud.kr/api/nts-businessman/v1/validate?serviceKey=YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "businesses": [{
      "b_no": "1234567890",
      "start_dt": "20200101",
      "p_nm": "홍길동"
    }]
  }'
```

---

## SDK Interface Design

```typescript
interface BusinessAdapter {
  // 상태조회 (단건)
  getStatus(params: StatusParams): Promise<StatusResponse>;

  // 상태조회 (다건)
  getStatusBatch(params: StatusBatchParams): Promise<StatusResponse[]>;

  // 진위확인 (단건)
  verify(params: VerifyParams): Promise<VerifyResponse>;

  // 진위확인 (다건)
  verifyBatch(params: VerifyBatchParams): Promise<VerifyResponse[]>;

  // 편의 메서드: 활성 여부
  isActive(businessNumber: string): Promise<boolean>;

  // 편의 메서드: 종합 정보
  getBusinessInfo(params: VerifyParams): Promise<BusinessInfo>;
}

interface StatusParams {
  businessNumber: string;  // 10자리 (하이픈 없이)
}

interface VerifyParams {
  businessNumber: string;
  startDate: string;       // YYYYMMDD
  representativeName: string;
  companyName?: string;
}

interface BusinessInfo {
  businessNumber: string;
  exists: boolean;
  status: {
    code: '01' | '02' | '03';
    description: string;
  };
  taxType: {
    code: string;
    description: string;
  };
  verification?: {
    valid: boolean;
    message: string;
  };
}
```

---

## Notes

1. **POST 방식**: 이 API는 다른 공공 API와 달리 POST 방식을 사용합니다.
2. **배열 요청**: 최대 100건까지 한 번에 조회 가능합니다.
3. **응답 시간**: 다건 조회 시 응답 시간이 길어질 수 있습니다.
4. **캐싱 권장**: 사업자 정보는 자주 변경되지 않으므로 24시간 캐싱 권장.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| v1 | Current | 현재 버전 |
