# SDK Architecture Design Document

공공데이터 범용 SDK 아키텍처 설계 문서

> **Version**: 1.0.0
> **Last Updated**: 2026-02-05
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

대한민국 정부 공공데이터 API들을 통합 인터페이스로 제공하는 범용 SDK 개발을 위한 설계 문서입니다.

### 1.2 Goals

| Goal | Description |
|------|-------------|
| **통합성** | 다양한 기관의 API를 단일 인터페이스로 제공 |
| **안정성** | 재시도, 서킷브레이커, 캐싱으로 안정적 운영 |
| **확장성** | 새로운 API 추가가 용이한 구조 |
| **타입안전** | TypeScript 완전 지원 |
| **사용성** | 최소한의 설정으로 바로 사용 가능 |

### 1.3 Non-Goals

- 실시간 스트리밍 지원
- 브라우저 직접 호출 (CORS 미지원)
- 공공 API 자체의 버그 수정

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Application                         │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
┌─────────────────────────────────▼───────────────────────────────┐
│                      PublicDataSDK                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Adapter Registry                         │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │ │
│  │  │ Weather │ │ Business│ │ Address │ │Transport│   ...    │ │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘          │ │
│  └───────┼──────────┼──────────┼──────────┼──────────────────┘ │
│          │          │          │          │                     │
│  ┌───────▼──────────▼──────────▼──────────▼──────────────────┐ │
│  │                    Base Adapter                            │ │
│  └────────────────────────────┬───────────────────────────────┘ │
│                               │                                 │
│  ┌────────────────────────────▼───────────────────────────────┐ │
│  │                      Core Layer                            │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │ │
│  │  │HttpClient│ │ Parser   │ │ Cache    │ │ Circuit  │      │ │
│  │  │+ Retry   │ │ XML/JSON │ │ Manager  │ │ Breaker  │      │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                        Public Data APIs
```

---

## 3. Core Components

### 3.1 HTTP Client

#### Responsibilities
- HTTP 요청 실행
- 서비스 키 자동 주입
- 타임아웃 처리
- 재시도 로직 (Exponential Backoff)

#### Design

```typescript
class HttpClient {
  constructor(config: ResolvedConfig);

  request<T>(config: HttpRequestConfig): Promise<HttpResponse<T>>;

  // Internal methods
  private buildUrl(baseUrl: string, params: object): string;
  private executeWithRetry<T>(config: RequestConfig): Promise<T>;
  private getRetryDelay(attempt: number): number;
}
```

#### Retry Strategy

```
Attempt 1: Immediate
Attempt 2: 1000ms + jitter
Attempt 3: 2000ms + jitter
Attempt 4: 4000ms + jitter
...
Max Delay: 30000ms
```

### 3.2 Response Parser

#### Responsibilities
- JSON 응답 파싱
- XML 응답 파싱 (에러 시 자동 감지)
- 응답 정규화
- 에러 추출

#### Design

```typescript
class ResponseParser {
  parse<T>(responseText: string): ParsedResponse<T>;

  private parseJson<T>(text: string): ParsedResponse<T>;
  private parseXml<T>(text: string): ParsedResponse<T>;
  private normalizeResponse<T>(raw: RawApiResponse): ParsedResponse<T>;
}
```

#### Response Normalization

| Source Format | Normalized |
|---------------|------------|
| `response.body.items.item` | `items[]` |
| `response.header.resultCode` | `success: boolean` |
| `OpenAPI_ServiceResponse.cmmMsgHeader` | `error: { code, message }` |

### 3.3 Cache Manager

#### Responsibilities
- 응답 캐싱
- TTL 관리
- 캐시 무효화
- Memory/Redis 어댑터 지원

#### Design

```typescript
interface CacheAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
}

class CacheManager {
  constructor(config: CacheConfig, adapter: CacheAdapter);

  generateKey(adapter: string, endpoint: string, params: object): string;
  getOrFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T>;
}
```

#### Default TTL by Data Type

| Data Type | TTL | Reason |
|-----------|-----|--------|
| Weather | 1 hour | 시간별 갱신 |
| Business | 24 hours | 거의 변하지 않음 |
| Address | 7 days | 매우 안정적 |
| Holidays | 24 hours | 연 1회 갱신 |
| Real Estate | 6 hours | 일 1회 갱신 |
| Transport | 30 seconds | 실시간 |

### 3.4 Circuit Breaker

#### Responsibilities
- 연속 실패 감지
- 서비스 보호 (Fail Fast)
- 자동 복구 시도

#### States

```
        ┌──────────┐
        │  CLOSED  │ ← Normal operation
        └────┬─────┘
             │ Failures >= Threshold
             ▼
        ┌──────────┐
        │   OPEN   │ ← Requests blocked
        └────┬─────┘
             │ Reset Timeout elapsed
             ▼
        ┌──────────┐
        │HALF_OPEN │ ← Testing recovery
        └────┬─────┘
             │
      ┌──────┴──────┐
      │             │
   Success       Failure
      │             │
      ▼             ▼
   CLOSED        OPEN
```

#### Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| `threshold` | 5 | 회로 개방 전 실패 횟수 |
| `resetTimeout` | 30000ms | OPEN → HALF_OPEN 전환 대기 |
| `windowDuration` | 60000ms | 실패 카운트 윈도우 |

---

## 4. Adapter Pattern

### 4.1 Base Adapter

모든 API 어댑터의 공통 기능을 제공하는 추상 클래스입니다.

```typescript
abstract class BaseAdapter {
  abstract readonly name: string;
  abstract readonly baseUrl: string;
  abstract readonly provider: string;

  protected httpClient: HttpClient;
  protected cache: CacheManager;
  protected circuitBreaker: CircuitBreaker;

  protected request<T>(endpoint: string, params: object): Promise<ApiResponse<T>>;
  protected requestAll<T>(endpoint: string, params: object): Promise<ApiResponse<T[]>>;

  // Helper methods
  protected formatDate(date: Date | string): string;
  protected formatTime(date: Date | string): string;
}
```

### 4.2 Adapter Implementation

각 API 제공자별로 BaseAdapter를 상속받아 구현합니다.

```typescript
class WeatherAdapter extends BaseAdapter {
  readonly name = 'weather';
  readonly baseUrl = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0';
  readonly provider = '기상청';

  async getForecast(params: ForecastParams): Promise<ApiResponse<ForecastItem[]>> {
    return this.request('/getVilageFcst', this.mapParams(params));
  }

  private mapParams(params: ForecastParams): Record<string, any> {
    return {
      base_date: params.baseDate,
      base_time: params.baseTime,
      nx: params.nx,
      ny: params.ny,
    };
  }
}
```

### 4.3 Adding New Adapters

새 API 추가 체크리스트:

- [ ] API 스펙 문서 작성 (`api-specs/{name}-api-spec.md`)
- [ ] 타입 정의 (`types/{name}.ts`)
- [ ] 어댑터 구현 (`adapters/{name}/index.ts`)
- [ ] SDK 클라이언트에 등록
- [ ] 테스트 작성
- [ ] 문서 업데이트

---

## 5. Error Handling

### 5.1 Error Hierarchy

```
PublicDataError (Base)
├── AuthenticationError (22, 30, 31)
├── RateLimitError (21)
├── ValidationError (10, 11)
├── NotFoundError (03)
├── ServiceUnavailableError (01, 02, 04, 05, 12)
├── NetworkError (Connection failures)
├── ParseError (Invalid response)
└── CircuitOpenError (Circuit breaker)
```

### 5.2 Error Recovery

| Error Type | Retryable | Recovery Strategy |
|------------|-----------|-------------------|
| RateLimitError | Yes | Wait and retry |
| ServiceUnavailableError | Yes | Exponential backoff |
| NetworkError | Yes | Immediate retry |
| AuthenticationError | No | Fail fast |
| ValidationError | No | Fail fast |
| NotFoundError | No | Return empty |
| CircuitOpenError | No | Wait for reset |

---

## 6. Configuration

### 6.1 Configuration Schema

```typescript
interface SDKConfig {
  // Required
  serviceKey: string;

  // Optional with defaults
  accountType?: 'development' | 'production';
  dataType?: 'JSON' | 'XML';
  cache?: CacheConfig;
  retry?: RetryConfig;
  circuitBreaker?: CircuitBreakerConfig;
  logging?: LoggingConfig;
  http?: HttpConfig;
}
```

### 6.2 Configuration Resolution

```
User Config → Merge with Defaults → Resolved Config
```

### 6.3 Environment Variables

| Variable | Description |
|----------|-------------|
| `PUBLIC_DATA_API_KEY` | Service key |
| `PUBLIC_DATA_LOG_LEVEL` | Logging level |
| `PUBLIC_DATA_CACHE_REDIS_URL` | Redis connection URL |

---

## 7. Testing Strategy

### 7.1 Unit Tests

- 각 모듈별 독립 테스트
- Mock 사용

### 7.2 Integration Tests

- VCR 패턴 (녹화/재생)
- Fixture 기반

### 7.3 E2E Tests

- 실제 API 호출 (CI에서 제한적)
- 개발 계정 사용

---

## 8. Performance Considerations

### 8.1 Connection Pooling

- HTTP Keep-Alive 활용
- 최대 연결 수 제한

### 8.2 Memory Management

- 대용량 응답 스트리밍 처리
- 캐시 크기 제한 (LRU)

### 8.3 Parallel Requests

- Promise.all 활용
- 레이트 리밋 고려

---

## 9. Security

### 9.1 Service Key Protection

- 환경변수 사용
- 로그 마스킹
- Git 제외 (.gitignore)

### 9.2 Input Validation

- SQL Injection 방지
- XSS 방지 (응답 데이터)

---

## 10. Dependencies

### 10.1 Runtime Dependencies

| Package | Purpose | Size |
|---------|---------|------|
| `fast-xml-parser` | XML 파싱 | ~45KB |

### 10.2 Peer Dependencies (Optional)

| Package | Purpose |
|---------|---------|
| `ioredis` | Redis 캐싱 |

### 10.3 Dev Dependencies

| Package | Purpose |
|---------|---------|
| `typescript` | 빌드 |
| `vitest` | 테스트 |
| `tsup` | 번들링 |

---

## 11. Versioning

### 11.1 SemVer

- **Major**: Breaking changes
- **Minor**: New features (backward compatible)
- **Patch**: Bug fixes

### 11.2 API Deprecation

1. Deprecation warning in docs
2. Console warning at runtime
3. Removal in next major version

---

## 12. Future Considerations

- [ ] WebSocket 지원 (실시간 API)
- [ ] GraphQL 래퍼
- [ ] React/Vue hooks
- [ ] CLI 도구
- [ ] 코드 생성기 (OpenAPI → TypeScript)

---

## Appendix

### A. Reference Implementations

- [PublicDataReader (Python)](https://github.com/WooilJeong/PublicDataReader)
- [OpenAI Node SDK](https://github.com/openai/openai-node)
- [AWS SDK v3](https://github.com/aws/aws-sdk-js-v3)

### B. Related Documents

- [API Specs](./api-specs/)
- [Interface Definitions](./interfaces/)
- [Error Code Reference](./error-codes.md)
