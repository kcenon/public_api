# TypeScript Interface Definitions

SDK 개발을 위한 TypeScript 인터페이스 정의 문서

> **Version**: 1.0.0
> **Last Updated**: 2026-02-05

---

## 1. Core Types

### 1.1 Configuration Types

```typescript
/**
 * SDK 메인 설정
 */
interface SDKConfig {
  /** 서비스 키 (data.go.kr에서 발급, Decoded 사용) */
  serviceKey: string;

  /** 계정 유형 (기본: development) */
  accountType?: 'development' | 'production';

  /** 응답 형식 (기본: JSON) */
  dataType?: 'JSON' | 'XML';

  /** 캐시 설정 */
  cache?: CacheConfig;

  /** 재시도 설정 */
  retry?: RetryConfig;

  /** 서킷브레이커 설정 */
  circuitBreaker?: CircuitBreakerConfig;

  /** 로깅 설정 */
  logging?: LoggingConfig;

  /** HTTP 클라이언트 설정 */
  http?: HttpConfig;
}

/**
 * 캐시 설정
 */
interface CacheConfig {
  /** 캐시 활성화 (기본: true) */
  enabled?: boolean;

  /** 캐시 어댑터 (기본: memory) */
  adapter?: 'memory' | 'redis';

  /** 기본 TTL (초, 기본: 3600) */
  defaultTtl?: number;

  /** 어댑터별 TTL 오버라이드 */
  ttl?: Record<string, number>;

  /** 메모리 캐시 최대 크기 */
  maxSize?: number;

  /** Redis 연결 설정 */
  redis?: {
    host?: string;
    port?: number;
    password?: string;
    db?: number;
    keyPrefix?: string;
  };
}

/**
 * 재시도 설정
 */
interface RetryConfig {
  /** 최대 재시도 횟수 (기본: 3) */
  maxRetries?: number;

  /** 기본 대기 시간 (ms, 기본: 1000) */
  baseDelay?: number;

  /** 최대 대기 시간 (ms, 기본: 30000) */
  maxDelay?: number;

  /** 지터 비율 (기본: 0.1) */
  jitter?: number;

  /** 재시도할 HTTP 상태 코드 */
  retryOnStatusCodes?: number[];
}

/**
 * 서킷브레이커 설정
 */
interface CircuitBreakerConfig {
  /** 활성화 (기본: true) */
  enabled?: boolean;

  /** 실패 임계값 (기본: 5) */
  threshold?: number;

  /** 리셋 타임아웃 (ms, 기본: 30000) */
  resetTimeout?: number;

  /** 실패 카운트 윈도우 (ms, 기본: 60000) */
  windowDuration?: number;
}

/**
 * 로깅 설정
 */
interface LoggingConfig {
  /** 로그 레벨 */
  level?: 'debug' | 'info' | 'warn' | 'error' | 'silent';

  /** 커스텀 로거 */
  logger?: Logger;
}

/**
 * 로거 인터페이스
 */
interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

/**
 * HTTP 클라이언트 설정
 */
interface HttpConfig {
  /** 타임아웃 (ms, 기본: 30000) */
  timeout?: number;

  /** 기본 헤더 */
  headers?: Record<string, string>;

  /** 베이스 URL 오버라이드 (테스트용) */
  baseUrl?: string;
}
```

### 1.2 Response Types

```typescript
/**
 * API 응답 래퍼
 */
interface ApiResponse<T> {
  /** 응답 데이터 */
  data: T;

  /** 페이지네이션 정보 */
  pagination?: PaginationInfo;

  /** 메타데이터 */
  meta: ResponseMeta;
}

/**
 * 페이지네이션 정보
 */
interface PaginationInfo {
  pageNo: number;
  numOfRows: number;
  totalCount: number;
  totalPages: number;
}

/**
 * 응답 메타데이터
 */
interface ResponseMeta {
  /** 캐시 여부 */
  cached: boolean;

  /** 캐시 시점 */
  cachedAt?: Date;

  /** 응답 시간 (ms) */
  responseTime: number;

  /** 요청 ID */
  requestId: string;
}

/**
 * 요청 옵션
 */
interface RequestOptions {
  /** 캐시 옵션 */
  cache?: {
    /** 캐시 우회 */
    bypass?: boolean;
    /** 커스텀 TTL */
    ttl?: number;
  };

  /** 타임아웃 오버라이드 */
  timeout?: number;

  /** 취소 시그널 */
  signal?: AbortSignal;
}
```

### 1.3 Error Types

```typescript
/**
 * 기본 에러 클래스
 */
class PublicDataError extends Error {
  readonly code: string;
  readonly originalResponse?: unknown;
  readonly timestamp: Date;
}

/**
 * 인증 에러 (코드: 22, 30, 31)
 */
class AuthenticationError extends PublicDataError {}

/**
 * 레이트 리밋 에러 (코드: 21)
 */
class RateLimitError extends PublicDataError {
  readonly retryAfter?: number;
}

/**
 * 데이터 없음 에러 (코드: 03)
 */
class NotFoundError extends PublicDataError {}

/**
 * 유효성 검사 에러 (코드: 10, 11)
 */
class ValidationError extends PublicDataError {
  readonly invalidParams?: string[];
}

/**
 * 서비스 불가 에러 (코드: 01, 02, 04, 05, 12)
 */
class ServiceUnavailableError extends PublicDataError {}

/**
 * 네트워크 에러
 */
class NetworkError extends PublicDataError {}

/**
 * 파싱 에러
 */
class ParseError extends PublicDataError {
  readonly rawResponse?: string;
}

/**
 * 서킷브레이커 개방 에러
 */
class CircuitOpenError extends PublicDataError {
  readonly resetTime: Date;
}
```

---

## 2. Adapter Interfaces

### 2.1 Base Adapter

```typescript
/**
 * 어댑터 정보
 */
interface AdapterInfo {
  name: string;
  baseUrl: string;
  provider: string;
  description: string;
  endpoints: string[];
}

/**
 * 기본 어댑터 인터페이스
 */
interface IBaseAdapter {
  readonly name: string;
  readonly baseUrl: string;
  readonly provider: string;
  readonly description: string;

  getInfo(): AdapterInfo;
}
```

### 2.2 Weather Adapter

```typescript
/**
 * 날씨 예보 파라미터
 */
interface ForecastParams {
  /** 발표일자 (YYYYMMDD) */
  baseDate: string;

  /** 발표시각 (HHMM) */
  baseTime: string;

  /** 격자 X 좌표 */
  nx: number;

  /** 격자 Y 좌표 */
  ny: number;

  /** 페이지 번호 */
  pageNo?: number;

  /** 페이지당 결과 수 */
  numOfRows?: number;
}

/**
 * 날씨 예보 항목
 */
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

/**
 * 날씨 카테고리
 */
type WeatherCategory =
  | 'POP'   // 강수확률
  | 'PTY'   // 강수형태
  | 'PCP'   // 강수량
  | 'REH'   // 습도
  | 'SNO'   // 적설
  | 'SKY'   // 하늘상태
  | 'TMP'   // 기온
  | 'TMN'   // 최저기온
  | 'TMX'   // 최고기온
  | 'VEC'   // 풍향
  | 'WSD';  // 풍속

/**
 * 가공된 날씨 데이터
 */
interface ProcessedWeatherData {
  dateTime: Date;
  temperature?: number;
  humidity?: number;
  precipitationProbability?: number;
  precipitationType?: string;
  skyCondition?: string;
  windSpeed?: number;
  windDirection?: number;
}

/**
 * 날씨 어댑터 인터페이스
 */
interface IWeatherAdapter extends IBaseAdapter {
  getForecast(params: ForecastParams, options?: RequestOptions): Promise<ApiResponse<ForecastItem[]>>;
  getCurrentConditions(params: ForecastParams, options?: RequestOptions): Promise<ApiResponse<ForecastItem[]>>;
  getUltraShortForecast(params: ForecastParams, options?: RequestOptions): Promise<ApiResponse<ForecastItem[]>>;
  getForecastForLocation(nx: number, ny: number, options?: RequestOptions): Promise<ApiResponse<ForecastItem[]>>;
  getProcessedForecast(params: ForecastParams, options?: RequestOptions): Promise<ApiResponse<ProcessedWeatherData[]>>;
}
```

### 2.3 Business Adapter

```typescript
/**
 * 사업자 상태조회 파라미터
 */
interface BusinessStatusParams {
  /** 사업자등록번호 (10자리) */
  businessNumber: string;
}

/**
 * 사업자 진위확인 파라미터
 */
interface BusinessVerifyParams {
  /** 사업자등록번호 */
  businessNumber: string;

  /** 개업일자 (YYYYMMDD) */
  startDate?: string;

  /** 대표자명 */
  representativeName?: string;

  /** 상호 */
  companyName?: string;
}

/**
 * 납세자 상태 코드
 */
type BusinessStatusCode = '01' | '02' | '03';

/**
 * 과세 유형 코드
 */
type TaxTypeCode = '01' | '02' | '03' | '04' | '05' | '06' | '07';

/**
 * 사업자 상태 결과
 */
interface BusinessStatusResult {
  businessNumber: string;
  businessStatus: BusinessStatusCode;
  businessStatusDescription: string;
  taxType: TaxTypeCode;
  taxTypeDescription: string;
  closedDate?: string;
}

/**
 * 사업자 진위확인 결과
 */
interface BusinessVerifyResult {
  businessNumber: string;
  valid: '01' | '02';
  validMessage: string;
}

/**
 * 통합 사업자 정보
 */
interface BusinessInfo {
  businessNumber: string;
  exists: boolean;
  status: {
    code: BusinessStatusCode;
    description: string;
  };
  taxType: {
    code: TaxTypeCode;
    description: string;
  };
  verification?: {
    valid: boolean;
    message: string;
  };
}

/**
 * 사업자 어댑터 인터페이스
 */
interface IBusinessAdapter extends IBaseAdapter {
  getStatus(params: BusinessStatusParams, options?: RequestOptions): Promise<ApiResponse<BusinessStatusResult>>;
  verify(params: BusinessVerifyParams, options?: RequestOptions): Promise<ApiResponse<BusinessVerifyResult>>;
  getBusinessInfo(params: BusinessVerifyParams, options?: RequestOptions): Promise<ApiResponse<BusinessInfo>>;
  isActive(businessNumber: string, options?: RequestOptions): Promise<boolean>;
}
```

### 2.4 Address Adapter

```typescript
/**
 * 주소 검색 파라미터
 */
interface AddressSearchParams {
  /** 검색 키워드 */
  keyword: string;

  /** 페이지 번호 */
  page?: number;

  /** 페이지당 결과 수 */
  pageSize?: number;

  /** 변동이력 포함 */
  includeHistory?: boolean;

  /** 정렬 기준 */
  sort?: 'none' | 'road' | 'location';
}

/**
 * 주소 결과
 */
interface AddressResult {
  /** 전체 도로명주소 */
  roadAddress: string;

  /** 도로명주소 (참고항목 제외) */
  roadAddressMain: string;

  /** 지번주소 */
  jibunAddress: string;

  /** 영문주소 */
  englishAddress: string;

  /** 우편번호 */
  zipCode: string;

  /** 건물명 */
  buildingName?: string;

  /** 행정구역 정보 */
  district: {
    sido: string;
    sigungu: string;
    dong: string;
  };

  /** 도로명 정보 */
  road: {
    name: string;
    buildingMainNumber: string;
    buildingSubNumber: string;
  };

  /** 관리 코드 */
  codes: {
    adminCode: string;
    roadCode: string;
    buildingCode: string;
  };
}

/**
 * 좌표 결과
 */
interface CoordinatesResult {
  x: number;
  y: number;
  buildingName?: string;
}

/**
 * 주소 어댑터 인터페이스
 */
interface IAddressAdapter extends IBaseAdapter {
  search(params: AddressSearchParams, options?: RequestOptions): Promise<ApiResponse<AddressResult[]>>;
  getCoordinates(address: AddressResult, options?: RequestOptions): Promise<ApiResponse<CoordinatesResult>>;
  searchEnglish(params: AddressSearchParams, options?: RequestOptions): Promise<ApiResponse<AddressResult[]>>;
  getZipCode(address: string, options?: RequestOptions): Promise<string>;
}
```

---

## 3. SDK Main Interface

```typescript
/**
 * 메인 SDK 인터페이스
 */
interface IPublicDataSDK {
  /** 날씨 어댑터 */
  readonly weather: IWeatherAdapter;

  /** 사업자등록 어댑터 */
  readonly business: IBusinessAdapter;

  /** 주소 어댑터 */
  readonly address: IAddressAdapter;

  /** 헬스 체크 */
  getHealth(): HealthStatus;

  /** 캐시 초기화 */
  clearCache(): Promise<void>;

  /** 서킷브레이커 리셋 */
  resetCircuitBreakers(): void;

  /** 설정 조회 */
  getConfig(): SDKConfig;

  /** 어댑터 목록 */
  getAdapters(): string[];

  /** 어댑터 정보 */
  getAdapterInfo(name: string): AdapterInfo | null;
}

/**
 * SDK 헬스 상태
 */
interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';

  adapters: Record<string, {
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastSuccess?: Date;
    lastError?: Date;
    circuitState: 'closed' | 'open' | 'half-open';
  }>;

  cache: {
    enabled: boolean;
    type: string;
    size?: number;
    hitRate?: number;
  };

  rateLimiter: {
    requestsToday: number;
    remainingToday: number;
    requestsThisMinute: number;
    remainingThisMinute: number;
  };
}
```

---

## 4. Utility Types

```typescript
/**
 * 필수 키 지정
 */
type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * 선택 키 지정
 */
type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * 깊은 Partial
 */
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * 격자 좌표
 */
interface GridCoordinates {
  nx: number;
  ny: number;
}

/**
 * 위경도 좌표
 */
interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * 날짜 범위
 */
interface DateRange {
  startDate: string;
  endDate: string;
}
```

---

## 5. Constants

```typescript
/**
 * 에러 코드 상수
 */
const ERROR_CODES = {
  '00': 'NORMAL_CODE',
  '01': 'APPLICATION_ERROR',
  '02': 'DB_ERROR',
  '03': 'NODATA_ERROR',
  '04': 'HTTP_ERROR',
  '05': 'SERVICETIME_OUT',
  '10': 'INVALID_REQUEST_PARAMETER_ERROR',
  '11': 'NO_MANDATORY_REQUEST_PARAMETERS_ERROR',
  '12': 'NO_OPENAPI_SERVICE_ERROR',
  '20': 'SERVICE_ACCESS_DENIED_ERROR',
  '21': 'SERVICE_REQUEST_LIMIT_EXCEEDED_ERROR',
  '22': 'SERVICE_KEY_IS_NOT_REGISTERED_ERROR',
  '30': 'KEY_EXPIRED_ERROR',
  '31': 'UNREGISTERED_IP_ERROR',
} as const;

/**
 * 날씨 카테고리 설명
 */
const WEATHER_CATEGORIES = {
  POP: '강수확률',
  PTY: '강수형태',
  PCP: '1시간 강수량',
  REH: '습도',
  SNO: '1시간 신적설',
  SKY: '하늘상태',
  TMP: '1시간 기온',
  TMN: '일 최저기온',
  TMX: '일 최고기온',
  VEC: '풍향',
  WSD: '풍속',
} as const;

/**
 * 기본 캐시 TTL (초)
 */
const DEFAULT_CACHE_TTL = {
  weather: 3600,
  business: 86400,
  address: 604800,
  holidays: 86400,
  transport: 60,
} as const;
```
