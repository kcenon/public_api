# API Specifications Index

공공데이터 SDK API 스펙 문서 목록

> **Version**: 1.0.0
> **Last Updated**: 2026-02-05
> **Total APIs**: 7

---

## Overview

이 디렉토리는 대한민국 공공데이터 API들의 상세 스펙 문서를 포함합니다. 각 문서는 SDK 구현을 위한 기술 참조 자료입니다.

---

## API Specifications

### Core APIs (Essential)

| API | Provider | Document | Priority |
|-----|----------|----------|----------|
| **Weather** | 기상청 | [weather-api-spec.md](./weather-api-spec.md) | ⭐ High |
| **Business** | 국세청 | [business-api-spec.md](./business-api-spec.md) | ⭐ High |
| **Address** | 행정안전부 | [address-api-spec.md](./address-api-spec.md) | ⭐ High |

### Reference APIs (Common Use)

| API | Provider | Document | Priority |
|-----|----------|----------|----------|
| **Holiday** | 한국천문연구원 | [holiday-api-spec.md](./holiday-api-spec.md) | Medium |
| **Transport** | 국토교통부 | [transport-api-spec.md](./transport-api-spec.md) | Medium |
| **Air Quality** | 한국환경공단 | [air-quality-api-spec.md](./air-quality-api-spec.md) | Medium |
| **Real Estate** | 국토교통부 | [real-estate-api-spec.md](./real-estate-api-spec.md) | Medium |

### Planned APIs (Future)

| API | Provider | Status |
|-----|----------|--------|
| Healthcare | 건강보험심사평가원 | Planned |
| Food Safety | 식품의약품안전처 | Planned |
| Cultural Events | 문화체육관광부 | Planned |
| Disaster Alert | 행정안전부 | Planned |
| Population Statistics | 통계청 | Planned |

---

## API Comparison

### Authentication

| API | Auth Type | Key Parameter | Special Notes |
|-----|-----------|---------------|---------------|
| Weather | Service Key | `serviceKey` | URL Decoded |
| Business | Service Key | `serviceKey` | POST method |
| Address | Confirm Key | `confmKey` | 별도 발급 필요 |
| Holiday | Service Key | `serviceKey` | URL Decoded |
| Transport | Service Key | `serviceKey` | URL Decoded |
| Air Quality | Service Key | `serviceKey` | URL Decoded |
| Real Estate | Service Key | `serviceKey` | URL Decoded |

### Response Formats

| API | Default | JSON Support | XML Support |
|-----|---------|--------------|-------------|
| Weather | XML | ✅ (`dataType=JSON`) | ✅ |
| Business | JSON | ✅ (Native) | ⚠️ (Error only) |
| Address | XML | ✅ (`resultType=json`) | ✅ |
| Holiday | XML | ✅ (`_type=json`) | ✅ |
| Transport | XML | ✅ (`_type=json`) | ✅ |
| Air Quality | XML | ✅ (`returnType=json`) | ✅ |
| Real Estate | XML | ✅ (varies) | ✅ |

### Rate Limits

| API | Development | Production | Notes |
|-----|-------------|------------|-------|
| Weather | 1,000/day | 10,000+/day | - |
| Business | 1,000,000/day | 1,000,000/day | Batch max 100 |
| Address | Unlimited | Unlimited | 과도한 호출 시 제한 |
| Holiday | 1,000/day | 10,000+/day | - |
| Transport | 1,000/day | 100,000+/day | - |
| Air Quality | 1,000/day | 500,000/day | - |
| Real Estate | 1,000/day | 100,000/day | - |

### Recommended Cache TTL

| API | TTL | Reason |
|-----|-----|--------|
| Weather | 1 hour | 시간별 갱신 |
| Business | 24 hours | 거의 변하지 않음 |
| Address | 7 days | 매우 안정적 |
| Holiday | 24 hours | 연 1회 갱신 |
| Transport | 30 seconds | 실시간 데이터 |
| Air Quality | 30-60 min | 시간별 갱신 |
| Real Estate | 6 hours | 일 1회 갱신 |

---

## Document Structure

각 API 스펙 문서는 다음 구조를 따릅니다:

```
1. Overview          - 서비스 개요, Base URL, 인증 방식
2. Endpoints         - 엔드포인트별 상세 스펙
3. Request Params    - 요청 파라미터 목록
4. Response Fields   - 응답 필드 설명
5. Code Tables       - 코드값 정의
6. Error Responses   - 에러 코드 및 메시지
7. Rate Limits       - 호출 제한
8. Sample Request    - cURL 예제
9. SDK Interface     - TypeScript 인터페이스 설계
10. Notes            - 주의사항 및 팁
```

---

## Quick Reference

### Common Parameters

```typescript
interface CommonParams {
  serviceKey: string;    // 인증키 (필수)
  pageNo?: number;       // 페이지 번호 (기본: 1)
  numOfRows?: number;    // 결과 수 (기본: 10~100)
  dataType?: string;     // 응답 형식 (JSON/XML)
}
```

### Common Response Structure

```typescript
interface CommonResponse<T> {
  response: {
    header: {
      resultCode: string;
      resultMsg: string;
    };
    body: {
      items: {
        item: T[];
      };
      numOfRows: number;
      pageNo: number;
      totalCount: number;
    };
  };
}
```

### Error Code Summary

| Code | Message | Description |
|------|---------|-------------|
| `00` | NORMAL_SERVICE | 정상 |
| `01` | APPLICATION_ERROR | 어플리케이션 에러 |
| `02` | DB_ERROR | 데이터베이스 에러 |
| `03` | NODATA_ERROR | 데이터 없음 |
| `04` | HTTP_ERROR | HTTP 에러 |
| `10` | INVALID_REQUEST_PARAMETER | 잘못된 요청 파라미터 |
| `20` | SERVICE_ACCESS_DENIED | 서비스 접근 거부 |
| `21` | TEMPORARILY_DISABLED | 서비스 일시 중지 |
| `22` | SERVICE_KEY_IS_NOT_REGISTERED | 미등록 서비스키 |
| `30` | SERVICE_KEY_IS_NOT_REGISTERED_ERROR | 등록되지 않은 서비스키 |
| `31` | DEADLINE_HAS_EXPIRED | 활용기간 만료 |

---

## Related Documents

| Document | Location | Description |
|----------|----------|-------------|
| SDK Architecture | [../design/sdk-architecture.md](../design/sdk-architecture.md) | 전체 아키텍처 설계 |
| TypeScript Interfaces | [../interfaces/typescript-interfaces.md](../interfaces/typescript-interfaces.md) | 타입 정의 |
| Error Codes | [../../reference/essential-guidelines-for-public-api.md](../../reference/essential-guidelines-for-public-api.md) | 에러 코드 상세 |
| API List | [../../reference/korea-government-public-apis.md](../../reference/korea-government-public-apis.md) | 전체 API 목록 |

---

## Contributing

새로운 API 스펙 문서 추가 시:

1. 이 README의 템플릿 구조를 따름
2. Provider, Source URL 명시
3. 모든 엔드포인트 문서화
4. SDK 인터페이스 설계 포함
5. 실제 테스트 후 Sample Request 작성
6. 이 목록에 추가

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-05 | Initial release with 7 APIs |
