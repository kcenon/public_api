# Software Design Specification (SDS)

# 대한민국 공공데이터 범용 SDK

> **Document Version**: 1.0.0
> **Created**: 2026-02-05
> **Status**: Draft
> **Based on**: SRS v1.0.0, PRD v1.0.0

---

## Document Control

### Referenced Documents

| Document | Version | Location |
|----------|---------|----------|
| SRS | 1.0.0 | [docs/SRS.md](./SRS.md) |
| PRD | 1.0.0 | [docs/PRD.md](./PRD.md) |
| SDK Architecture | 1.0.0 | [sdk/docs/design/sdk-architecture.md](./sdk/docs/design/sdk-architecture.md) |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Traceability Matrix](#2-traceability-matrix)
3. [Architecture Design](#3-architecture-design)
4. [Component Design](#4-component-design)
5. [Interface Design](#5-interface-design)
6. [Data Design](#6-data-design)
7. [Error Handling Design](#7-error-handling-design)
8. [Security Design](#8-security-design)

---

## 1. Introduction

### 1.1 Purpose

본 문서는 공공데이터 SDK의 상세 설계를 정의합니다. SRS에서 명세된 요구사항을 구현 가능한 설계로 변환합니다.

### 1.2 Design Principles

| Principle | Description |
|-----------|-------------|
| **Single Responsibility** | 각 모듈은 하나의 책임만 가짐 |
| **Open/Closed** | 확장에 열림, 수정에 닫힘 |
| **Dependency Inversion** | 추상화에 의존 |
| **Interface Segregation** | 작고 명확한 인터페이스 |

---

## 2. Traceability Matrix

### 2.1 SRS → SDS Mapping

| SRS Requirement | Design Component | Design Section |
|-----------------|------------------|----------------|
| SRS-CORE-001~005 | PublicDataSDK, ConfigManager | 4.1 |
| SRS-HTTP-001~005 | HttpClient | 4.2 |
| SRS-PARSE-001~004 | ResponseParser | 4.3 |
| SRS-CACHE-001~005 | CacheManager, CacheAdapter | 4.4 |
| SRS-CB-001~004 | CircuitBreaker | 4.5 |
| SRS-ERR-001~009 | Error Classes | 7 |
| SRS-ADAPT-001~003 | BaseAdapter | 4.6 |
| SRS-WTH-001~005 | WeatherAdapter | 4.7.1 |
| SRS-BIZ-001~005 | BusinessAdapter | 4.7.2 |
| SRS-ADDR-001~004 | AddressAdapter | 4.7.3 |
| SRS-HLDY-001~004 | HolidayAdapter | 4.7.4 |
| SRS-TRNS-001~004 | TransportAdapter | 4.7.5 |
| SRS-AIR-001~004 | AirQualityAdapter | 4.7.6 |
| SRS-RE-001~004 | RealEstateAdapter | 4.7.7 |
| SRS-SEC-001~004 | Security Module | 8 |
| SRS-PERF-001~003 | Performance Optimizations | 4.2, 4.4 |
| SRS-COMPAT-001~004 | Build Configuration | 3.4 |

### 2.2 Complete Traceability Chain

```
PRD Goal → PRD FR/US → SRS Requirement → SDS Component → Source File
────────────────────────────────────────────────────────────────────
G1       → FR-001     → SRS-CORE-001   → PublicDataSDK  → src/sdk.ts
G2       → FR-005     → SRS-HTTP-003   → HttpClient     → src/core/http-client.ts
G2       → FR-006     → SRS-CB-001     → CircuitBreaker → src/core/circuit-breaker.ts
G1       → FR-010     → SRS-WTH-001    → WeatherAdapter → src/adapters/weather/index.ts
```

---

## 3. Architecture Design

### 3.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           User Application                              │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          PublicDataSDK                                  │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                      Public API Layer                             │  │
│  │   sdk.weather  │  sdk.business  │  sdk.address  │  ...           │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                  │                                      │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                      Adapter Layer                                │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │  │
│  │  │Weather  │ │Business │ │Address  │ │Holiday  │ │Transport│    │  │
│  │  │Adapter  │ │Adapter  │ │Adapter  │ │Adapter  │ │Adapter  │    │  │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘    │  │
│  │       └───────────┴──────────┴───────────┴───────────┘          │  │
│  │                              │                                   │  │
│  │                    ┌─────────▼─────────┐                        │  │
│  │                    │   BaseAdapter     │                        │  │
│  │                    └─────────┬─────────┘                        │  │
│  └──────────────────────────────┼────────────────────────────────────┘  │
│                                 │                                      │
│  ┌──────────────────────────────▼────────────────────────────────────┐  │
│  │                        Core Layer                                 │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐    │  │
│  │  │ HttpClient │ │  Parser    │ │   Cache    │ │  Circuit   │    │  │
│  │  │  + Retry   │ │ XML/JSON   │ │  Manager   │ │  Breaker   │    │  │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                  │                                      │
│  ┌───────────────────────────────▼───────────────────────────────────┐  │
│  │                      Infrastructure Layer                         │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐                   │  │
│  │  │   Logger   │ │   Config   │ │   Utils    │                   │  │
│  │  └────────────┘ └────────────┘ └────────────┘                   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                        External Public APIs
```

### 3.2 Module Structure

```
src/
├── index.ts                      # Public exports
├── sdk.ts                        # PublicDataSDK class
├── config.ts                     # Configuration types & resolution
│
├── core/
│   ├── index.ts                  # Core exports
│   ├── http-client.ts            # HTTP client with retry
│   ├── parser.ts                 # Response parser
│   ├── cache/
│   │   ├── index.ts              # Cache manager
│   │   ├── memory-adapter.ts     # Memory cache
│   │   └── redis-adapter.ts      # Redis cache
│   ├── circuit-breaker.ts        # Circuit breaker
│   └── errors.ts                 # Error classes
│
├── adapters/
│   ├── base.ts                   # BaseAdapter abstract class
│   ├── weather/
│   │   ├── index.ts              # WeatherAdapter
│   │   ├── types.ts              # Weather types
│   │   └── utils.ts              # Coordinate conversion
│   ├── business/
│   │   ├── index.ts              # BusinessAdapter
│   │   ├── types.ts              # Business types
│   │   └── validator.ts          # Business number validator
│   ├── address/
│   ├── holiday/
│   ├── transport/
│   ├── air-quality/
│   └── real-estate/
│
├── utils/
│   ├── date.ts                   # Date utilities
│   ├── format.ts                 # Formatting utilities
│   └── hash.ts                   # Hashing utilities
│
└── types/
    ├── common.ts                 # Shared types
    ├── config.ts                 # Config types
    └── response.ts               # Response types
```

### 3.3 Dependency Graph

```
PublicDataSDK
    │
    ├──> ConfigManager
    │
    ├──> AdapterRegistry
    │       │
    │       ├──> WeatherAdapter ──┐
    │       ├──> BusinessAdapter ─┤
    │       ├──> AddressAdapter ──┤
    │       └──> ... ─────────────┤
    │                             │
    │                             ▼
    │                       BaseAdapter
    │                             │
    │       ┌─────────────────────┼─────────────────────┐
    │       │                     │                     │
    │       ▼                     ▼                     ▼
    ├──> HttpClient          CacheManager        CircuitBreaker
    │       │                     │
    │       │                     ├──> MemoryCacheAdapter
    │       │                     └──> RedisCacheAdapter
    │       │
    │       ▼
    └──> ResponseParser
```

### 3.4 Build Configuration

**[SRS-COMPAT-001~004]**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist"
  }
}
```

**tsup.config.ts**:
```typescript
export default {
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: true,
  target: 'node18'
};
```

---

## 4. Component Design

### 4.1 PublicDataSDK Class

**[SRS-CORE-001~005]**

#### 4.1.1 Class Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      PublicDataSDK                          │
├─────────────────────────────────────────────────────────────┤
│ - config: ResolvedConfig                                    │
│ - httpClient: HttpClient                                    │
│ - parser: ResponseParser                                    │
│ - cacheManager: CacheManager                                │
│ - circuitBreakers: Map<string, CircuitBreaker>              │
│ - _weather?: WeatherAdapter                                 │
│ - _business?: BusinessAdapter                               │
│ - _address?: AddressAdapter                                 │
│ - ...                                                       │
├─────────────────────────────────────────────────────────────┤
│ + constructor(config: SDKConfig)                            │
│ + get weather(): WeatherAdapter                             │
│ + get business(): BusinessAdapter                           │
│ + get address(): AddressAdapter                             │
│ + get holiday(): HolidayAdapter                             │
│ + get transport(): TransportAdapter                         │
│ + get airQuality(): AirQualityAdapter                       │
│ + get realEstate(): RealEstateAdapter                       │
│ + get cache(): CacheManager                                 │
│ + on(event: string, handler: Function): void                │
│ + off(event: string, handler: Function): void               │
│ - resolveConfig(config: SDKConfig): ResolvedConfig          │
│ - validateConfig(config: SDKConfig): void                   │
│ - initializeCore(): void                                    │
│ - createAdapter<T>(AdapterClass: Class<T>): T               │
└─────────────────────────────────────────────────────────────┘
```

#### 4.1.2 Implementation

```typescript
// src/sdk.ts
import { HttpClient } from './core/http-client';
import { ResponseParser } from './core/parser';
import { CacheManager } from './core/cache';
import { CircuitBreaker } from './core/circuit-breaker';
import { WeatherAdapter } from './adapters/weather';
import { BusinessAdapter } from './adapters/business';
import { AddressAdapter } from './adapters/address';
import { SDKConfig, ResolvedConfig, DEFAULT_CONFIG } from './config';
import { ValidationError } from './core/errors';

export class PublicDataSDK {
  private readonly config: ResolvedConfig;
  private readonly httpClient: HttpClient;
  private readonly parser: ResponseParser;
  private readonly cacheManager: CacheManager;
  private readonly circuitBreakers: Map<string, CircuitBreaker>;

  // Lazy-loaded adapters
  private _weather?: WeatherAdapter;
  private _business?: BusinessAdapter;
  private _address?: AddressAdapter;

  constructor(config: SDKConfig = {}) {
    this.validateConfig(config);
    this.config = this.resolveConfig(config);
    this.initializeCore();
  }

  // Adapter accessors with lazy initialization
  get weather(): WeatherAdapter {
    if (!this._weather) {
      this._weather = this.createAdapter(WeatherAdapter);
    }
    return this._weather;
  }

  get business(): BusinessAdapter {
    if (!this._business) {
      this._business = this.createAdapter(BusinessAdapter);
    }
    return this._business;
  }

  // ... other adapters

  private resolveConfig(config: SDKConfig): ResolvedConfig {
    const serviceKey = config.serviceKey || process.env.PUBLIC_DATA_API_KEY;
    if (!serviceKey) {
      throw new ValidationError('Service key is required');
    }

    return {
      ...DEFAULT_CONFIG,
      ...config,
      serviceKey,
      cache: { ...DEFAULT_CONFIG.cache, ...config.cache },
      retry: { ...DEFAULT_CONFIG.retry, ...config.retry },
      circuitBreaker: { ...DEFAULT_CONFIG.circuitBreaker, ...config.circuitBreaker },
    };
  }

  private validateConfig(config: SDKConfig): void {
    if (config.retry?.maxAttempts && (config.retry.maxAttempts < 1 || config.retry.maxAttempts > 10)) {
      throw new ValidationError('retry.maxAttempts must be between 1 and 10');
    }
    // ... other validations
  }

  private initializeCore(): void {
    this.parser = new ResponseParser();
    this.cacheManager = new CacheManager(this.config.cache);
    this.circuitBreakers = new Map();
    this.httpClient = new HttpClient(this.config, this.parser);
  }

  private createAdapter<T extends BaseAdapter>(
    AdapterClass: new (deps: AdapterDependencies) => T
  ): T {
    const circuitBreaker = this.getOrCreateCircuitBreaker(AdapterClass.name);
    return new AdapterClass({
      config: this.config,
      httpClient: this.httpClient,
      cacheManager: this.cacheManager,
      circuitBreaker,
    });
  }

  private getOrCreateCircuitBreaker(name: string): CircuitBreaker {
    if (!this.circuitBreakers.has(name)) {
      this.circuitBreakers.set(name, new CircuitBreaker(this.config.circuitBreaker));
    }
    return this.circuitBreakers.get(name)!;
  }
}
```

### 4.2 HttpClient Component

**[SRS-HTTP-001~005]**

#### 4.2.1 Class Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        HttpClient                           │
├─────────────────────────────────────────────────────────────┤
│ - config: ResolvedConfig                                    │
│ - parser: ResponseParser                                    │
├─────────────────────────────────────────────────────────────┤
│ + request<T>(config: RequestConfig): Promise<HttpResponse<T>>│
│ - buildUrl(baseUrl: string, endpoint: string, params): string│
│ - injectServiceKey(params: object, keyName: string): object │
│ - executeWithRetry<T>(config: RequestConfig): Promise<T>    │
│ - shouldRetry(error: Error, attempt: number): boolean       │
│ - getRetryDelay(attempt: number): number                    │
│ - executeRequest(config: RequestConfig): Promise<Response>  │
└─────────────────────────────────────────────────────────────┘
```

#### 4.2.2 Implementation

```typescript
// src/core/http-client.ts
import { ResolvedConfig, RequestConfig, HttpResponse } from '../types';
import { ResponseParser } from './parser';
import { NetworkError, RateLimitError, ServiceUnavailableError } from './errors';

export class HttpClient {
  constructor(
    private readonly config: ResolvedConfig,
    private readonly parser: ResponseParser
  ) {}

  async request<T>(requestConfig: RequestConfig): Promise<HttpResponse<T>> {
    const startTime = Date.now();

    try {
      const response = await this.executeWithRetry<T>(requestConfig);
      return {
        ...response,
        timing: {
          start: startTime,
          end: Date.now(),
          duration: Date.now() - startTime,
        },
      };
    } catch (error) {
      throw this.wrapError(error);
    }
  }

  private async executeWithRetry<T>(config: RequestConfig): Promise<T> {
    const { maxAttempts } = this.config.retry;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await this.executeRequest<T>(config);
      } catch (error) {
        lastError = error as Error;

        if (!this.shouldRetry(error as Error, attempt)) {
          throw error;
        }

        if (attempt < maxAttempts) {
          const delay = this.getRetryDelay(attempt);
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  private async executeRequest<T>(config: RequestConfig): Promise<T> {
    const url = this.buildUrl(config.baseUrl, config.endpoint, config.params);
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      config.timeout || this.config.http.timeout
    );

    try {
      const response = await fetch(url, {
        method: config.method || 'GET',
        headers: {
          'User-Agent': this.config.http.userAgent,
          ...config.headers,
        },
        body: config.body ? JSON.stringify(config.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const text = await response.text();
      return this.parser.parse<T>(text, response.status);
    } catch (error) {
      clearTimeout(timeoutId);

      if ((error as Error).name === 'AbortError') {
        throw new NetworkError('Request timeout', {
          timeout: config.timeout || this.config.http.timeout,
        });
      }
      throw error;
    }
  }

  private buildUrl(baseUrl: string, endpoint: string, params?: Record<string, unknown>): string {
    const url = new URL(endpoint, baseUrl);
    const allParams = this.injectServiceKey(params || {});

    Object.entries(allParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });

    return url.toString();
  }

  private injectServiceKey(params: Record<string, unknown>): Record<string, unknown> {
    return {
      ...params,
      serviceKey: this.config.serviceKey,
    };
  }

  private shouldRetry(error: Error, attempt: number): boolean {
    if (attempt >= this.config.retry.maxAttempts) return false;
    if (error instanceof NetworkError) return true;
    if (error instanceof ServiceUnavailableError) return true;
    if (error instanceof RateLimitError) return true;
    return false;
  }

  private getRetryDelay(attempt: number): number {
    const { initialDelay, maxDelay, backoffMultiplier, jitter } = this.config.retry;
    let delay = Math.min(initialDelay * Math.pow(backoffMultiplier, attempt - 1), maxDelay);

    if (jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }

    return Math.floor(delay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 4.3 ResponseParser Component

**[SRS-PARSE-001~004]**

#### 4.3.1 Class Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     ResponseParser                          │
├─────────────────────────────────────────────────────────────┤
│ - xmlParser: XMLParser                                      │
├─────────────────────────────────────────────────────────────┤
│ + parse<T>(text: string, status: number): ParsedResponse<T> │
│ - detectFormat(text: string): 'json' | 'xml'                │
│ - parseJson<T>(text: string): RawResponse                   │
│ - parseXml<T>(text: string): RawResponse                    │
│ - normalize<T>(raw: RawResponse): NormalizedResponse<T>     │
│ - extractError(raw: RawResponse): ErrorInfo | null          │
│ - extractItems<T>(raw: RawResponse): T[]                    │
│ - extractPagination(raw: RawResponse): PaginationInfo       │
└─────────────────────────────────────────────────────────────┘
```

#### 4.3.2 Implementation

```typescript
// src/core/parser.ts
import { XMLParser } from 'fast-xml-parser';
import { ParseError, AuthenticationError, ValidationError, NotFoundError } from './errors';

export class ResponseParser {
  private readonly xmlParser: XMLParser;

  constructor() {
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
    });
  }

  parse<T>(text: string, status: number): NormalizedResponse<T> {
    const format = this.detectFormat(text);
    const raw = format === 'json' ? this.parseJson(text) : this.parseXml(text);

    // Check for error in response
    const errorInfo = this.extractError(raw);
    if (errorInfo) {
      throw this.createError(errorInfo);
    }

    return this.normalize<T>(raw);
  }

  private detectFormat(text: string): 'json' | 'xml' {
    const trimmed = text.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      return 'json';
    }
    if (trimmed.startsWith('<?xml') || trimmed.startsWith('<')) {
      return 'xml';
    }
    throw new ParseError('Unable to detect response format');
  }

  private parseJson(text: string): RawResponse {
    try {
      return JSON.parse(text);
    } catch {
      throw new ParseError('Invalid JSON response', { raw: text.substring(0, 200) });
    }
  }

  private parseXml(text: string): RawResponse {
    try {
      return this.xmlParser.parse(text);
    } catch {
      throw new ParseError('Invalid XML response', { raw: text.substring(0, 200) });
    }
  }

  private normalize<T>(raw: RawResponse): NormalizedResponse<T> {
    const items = this.extractItems<T>(raw);
    const pagination = this.extractPagination(raw);

    return {
      success: true,
      items,
      pagination,
      raw,
    };
  }

  private extractItems<T>(raw: RawResponse): T[] {
    // Pattern 1: response.body.items.item (공공데이터 표준)
    let items = raw?.response?.body?.items?.item;

    // Pattern 2: results.juso (주소 API)
    if (!items) items = raw?.results?.juso;

    // Pattern 3: data (사업자 API)
    if (!items) items = raw?.data;

    // Pattern 4: items directly
    if (!items) items = raw?.items;

    // Normalize to array
    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  }

  private extractPagination(raw: RawResponse): PaginationInfo | undefined {
    const body = raw?.response?.body || raw?.results?.common;
    if (!body) return undefined;

    const pageNo = parseInt(body.pageNo || body.currentPage || '1', 10);
    const numOfRows = parseInt(body.numOfRows || body.countPerPage || '10', 10);
    const totalCount = parseInt(body.totalCount || '0', 10);

    return {
      page: pageNo,
      pageSize: numOfRows,
      totalCount,
      totalPages: Math.ceil(totalCount / numOfRows),
    };
  }

  private extractError(raw: RawResponse): ErrorInfo | null {
    // Pattern 1: Standard header
    const resultCode = raw?.response?.header?.resultCode;
    if (resultCode && resultCode !== '00') {
      return {
        code: resultCode,
        message: raw.response.header.resultMsg,
      };
    }

    // Pattern 2: OpenAPI error
    const returnReasonCode = raw?.OpenAPI_ServiceResponse?.cmmMsgHeader?.returnReasonCode;
    if (returnReasonCode) {
      return {
        code: returnReasonCode,
        message: raw.OpenAPI_ServiceResponse.cmmMsgHeader.errMsg,
      };
    }

    // Pattern 3: Address API
    const errorCode = raw?.results?.common?.errorCode;
    if (errorCode && errorCode !== '0') {
      return {
        code: errorCode,
        message: raw.results.common.errorMessage,
      };
    }

    // Pattern 4: Business API
    if (raw?.status_code === 'ERROR') {
      return {
        code: 'ERROR',
        message: raw.msg,
      };
    }

    return null;
  }

  private createError(info: ErrorInfo): Error {
    const { code, message } = info;

    // Authentication errors
    if (['22', '30', '31', 'E0001', 'E0011'].includes(code)) {
      return new AuthenticationError(message, { code });
    }

    // Rate limit
    if (['21', 'E0014'].includes(code)) {
      return new RateLimitError(message, { code });
    }

    // Validation errors
    if (['10', '11', 'E0005', 'E0006', 'E0010'].includes(code)) {
      return new ValidationError(message, { code });
    }

    // Not found
    if (code === '03') {
      return new NotFoundError(message, { code });
    }

    // Service unavailable
    return new ServiceUnavailableError(message, { code });
  }
}
```

### 4.4 CacheManager Component

**[SRS-CACHE-001~005]**

#### 4.4.1 Class Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   <<interface>>                             │
│                    CacheAdapter                             │
├─────────────────────────────────────────────────────────────┤
│ + get<T>(key: string): Promise<T | null>                    │
│ + set<T>(key: string, value: T, ttl: number): Promise<void> │
│ + delete(key: string): Promise<boolean>                     │
│ + clear(): Promise<void>                                    │
│ + has(key: string): Promise<boolean>                        │
└─────────────────────────────────────────────────────────────┘
                            △
                            │
            ┌───────────────┴───────────────┐
            │                               │
┌───────────┴───────────┐     ┌─────────────┴───────────┐
│  MemoryCacheAdapter   │     │   RedisCacheAdapter     │
├───────────────────────┤     ├─────────────────────────┤
│ - cache: Map          │     │ - client: Redis         │
│ - maxSize: number     │     │ - keyPrefix: string     │
└───────────────────────┘     └─────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────┐
│                      CacheManager                           │
├─────────────────────────────────────────────────────────────┤
│ - adapter: CacheAdapter                                     │
│ - config: CacheConfig                                       │
├─────────────────────────────────────────────────────────────┤
│ + constructor(config: CacheConfig)                          │
│ + generateKey(adapter, endpoint, params): string            │
│ + get<T>(key: string): Promise<T | null>                    │
│ + set<T>(key, value, ttl?): Promise<void>                   │
│ + getOrFetch<T>(key, fetcher, ttl?): Promise<T>             │
│ + delete(key: string): Promise<boolean>                     │
│ + clearAdapter(adapterName: string): Promise<void>          │
│ + clear(): Promise<void>                                    │
└─────────────────────────────────────────────────────────────┘
```

#### 4.4.2 Implementation

```typescript
// src/core/cache/index.ts
import { createHash } from 'crypto';
import { CacheAdapter, CacheConfig } from '../../types';
import { MemoryCacheAdapter } from './memory-adapter';

export class CacheManager {
  private readonly adapter: CacheAdapter;
  private readonly config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
    this.adapter = this.createAdapter(config);
  }

  private createAdapter(config: CacheConfig): CacheAdapter {
    if (config.adapter === 'redis' && config.redis) {
      // Dynamic import for optional redis dependency
      const { RedisCacheAdapter } = require('./redis-adapter');
      return new RedisCacheAdapter(config.redis);
    }
    return new MemoryCacheAdapter(config.maxSize || 1000);
  }

  generateKey(adapter: string, endpoint: string, params: Record<string, unknown>): string {
    const paramsHash = createHash('sha256')
      .update(JSON.stringify(params))
      .digest('hex')
      .substring(0, 8);

    return `${adapter}:${endpoint}:${paramsHash}`;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.config.enabled) return null;
    return this.adapter.get<T>(key);
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (!this.config.enabled) return;
    await this.adapter.set(key, value, ttl || this.config.defaultTTL);
  }

  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    if (!this.config.enabled) {
      return fetcher();
    }

    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetcher();
    await this.set(key, value, ttl);
    return value;
  }

  async delete(key: string): Promise<boolean> {
    return this.adapter.delete(key);
  }

  async clearAdapter(adapterName: string): Promise<void> {
    // Implementation depends on adapter capabilities
    // For memory adapter, iterate and delete matching keys
  }

  async clear(): Promise<void> {
    return this.adapter.clear();
  }
}
```

```typescript
// src/core/cache/memory-adapter.ts
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class MemoryCacheAdapter implements CacheAdapter {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private readonly maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    // LRU eviction if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl * 1000,
    });
  }

  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }
}
```

### 4.5 CircuitBreaker Component

**[SRS-CB-001~004]**

#### 4.5.1 State Machine

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Circuit Breaker State Machine                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │                         CLOSED                               │  │
│   │  • Normal operation                                          │  │
│   │  • Requests pass through                                     │  │
│   │  • Track failures in sliding window                          │  │
│   └──────────────────────────┬───────────────────────────────────┘  │
│                              │                                      │
│                              │ failures >= threshold                │
│                              ▼                                      │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │                          OPEN                                │  │
│   │  • Requests blocked immediately                              │  │
│   │  • Throw CircuitOpenError                                    │  │
│   │  • Start reset timer                                         │  │
│   └──────────────────────────┬───────────────────────────────────┘  │
│                              │                                      │
│                              │ resetTimeout elapsed                 │
│                              ▼                                      │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │                       HALF_OPEN                              │  │
│   │  • Allow single test request                                 │  │
│   │  • Success → CLOSED                                          │  │
│   │  • Failure → OPEN (reset timer)                              │  │
│   └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### 4.5.2 Implementation

```typescript
// src/core/circuit-breaker.ts
import { CircuitBreakerConfig } from '../types';
import { CircuitOpenError } from './errors';

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures: number[] = [];
  private lastFailureTime: number = 0;
  private readonly config: CircuitBreakerConfig;

  constructor(config: CircuitBreakerConfig) {
    this.config = config;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.config.enabled) {
      return fn();
    }

    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
      } else {
        throw new CircuitOpenError('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      this.failures = [];
    }
  }

  private onFailure(): void {
    const now = Date.now();
    this.failures.push(now);
    this.lastFailureTime = now;

    // Remove failures outside the window
    const windowStart = now - this.config.windowDuration;
    this.failures = this.failures.filter(t => t > windowStart);

    if (this.failures.length >= this.config.threshold) {
      this.state = 'OPEN';
    }

    if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
    }
  }

  private shouldAttemptReset(): boolean {
    return Date.now() - this.lastFailureTime >= this.config.resetTimeout;
  }

  getState(): CircuitState {
    return this.state;
  }

  reset(): void {
    this.state = 'CLOSED';
    this.failures = [];
    this.lastFailureTime = 0;
  }
}
```

### 4.6 BaseAdapter Component

**[SRS-ADAPT-001~003]**

#### 4.6.1 Class Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   <<abstract>>                              │
│                    BaseAdapter                              │
├─────────────────────────────────────────────────────────────┤
│ # httpClient: HttpClient                                    │
│ # cacheManager: CacheManager                                │
│ # circuitBreaker: CircuitBreaker                            │
│ # config: ResolvedConfig                                    │
├─────────────────────────────────────────────────────────────┤
│ + abstract readonly name: string                            │
│ + abstract readonly baseUrl: string                         │
│ + abstract readonly provider: string                        │
│ + abstract readonly defaultTTL: number                      │
│ + abstract readonly serviceKeyParam: string                 │
├─────────────────────────────────────────────────────────────┤
│ # request<T>(endpoint, params, options?): Promise<Response> │
│ # requestAll<T>(endpoint, params): Promise<Response<T[]>>   │
│ # getCacheKey(endpoint, params): string                     │
│ # formatDate(date: Date | string): string                   │
│ # formatTime(date: Date | string): string                   │
└─────────────────────────────────────────────────────────────┘
```

#### 4.6.2 Implementation

```typescript
// src/adapters/base.ts
import { HttpClient } from '../core/http-client';
import { CacheManager } from '../core/cache';
import { CircuitBreaker } from '../core/circuit-breaker';
import { ResolvedConfig, ApiResponse, RequestOptions } from '../types';

export interface AdapterDependencies {
  config: ResolvedConfig;
  httpClient: HttpClient;
  cacheManager: CacheManager;
  circuitBreaker: CircuitBreaker;
}

export abstract class BaseAdapter {
  protected readonly httpClient: HttpClient;
  protected readonly cacheManager: CacheManager;
  protected readonly circuitBreaker: CircuitBreaker;
  protected readonly config: ResolvedConfig;

  abstract readonly name: string;
  abstract readonly baseUrl: string;
  abstract readonly provider: string;
  abstract readonly defaultTTL: number;
  abstract readonly serviceKeyParam: string;

  constructor(deps: AdapterDependencies) {
    this.config = deps.config;
    this.httpClient = deps.httpClient;
    this.cacheManager = deps.cacheManager;
    this.circuitBreaker = deps.circuitBreaker;
  }

  protected async request<T>(
    endpoint: string,
    params: Record<string, unknown>,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const cacheKey = this.getCacheKey(endpoint, params);
    const ttl = options.ttl ?? this.defaultTTL;

    return this.cacheManager.getOrFetch(
      cacheKey,
      () => this.circuitBreaker.execute(() =>
        this.httpClient.request<T>({
          baseUrl: this.baseUrl,
          endpoint,
          params: {
            ...params,
            [this.serviceKeyParam]: this.config.serviceKey,
          },
          method: options.method || 'GET',
        })
      ),
      ttl
    );
  }

  protected async requestAll<T>(
    endpoint: string,
    params: Record<string, unknown>
  ): Promise<ApiResponse<T[]>> {
    const allItems: T[] = [];
    let page = 1;
    const pageSize = 1000;

    while (true) {
      const response = await this.request<T[]>(endpoint, {
        ...params,
        pageNo: page,
        numOfRows: pageSize,
      });

      allItems.push(...response.items);

      if (!response.pagination || page >= response.pagination.totalPages) {
        break;
      }
      page++;
    }

    return {
      success: true,
      items: allItems,
      raw: null,
    };
  }

  protected getCacheKey(endpoint: string, params: Record<string, unknown>): string {
    return this.cacheManager.generateKey(this.name, endpoint, params);
  }

  protected formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().slice(0, 10).replace(/-/g, '');
  }

  protected formatTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().slice(11, 16).replace(':', '');
  }
}
```

### 4.7 Adapter Implementations

#### 4.7.1 WeatherAdapter

**[SRS-WTH-001~005]**

```typescript
// src/adapters/weather/index.ts
import { BaseAdapter } from '../base';
import { ForecastParams, CurrentParams, ForecastItem, CurrentWeather } from './types';
import { convertToGrid } from './utils';

export class WeatherAdapter extends BaseAdapter {
  readonly name = 'weather';
  readonly baseUrl = 'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0';
  readonly provider = '기상청';
  readonly defaultTTL = 3600; // 1 hour
  readonly serviceKeyParam = 'serviceKey';

  async getForecast(params: ForecastParams): Promise<ApiResponse<ForecastItem[]>> {
    return this.request('/getVilageFcst', {
      base_date: params.baseDate,
      base_time: params.baseTime,
      nx: params.nx,
      ny: params.ny,
      pageNo: params.pageNo || 1,
      numOfRows: params.numOfRows || 1000,
      dataType: 'JSON',
    });
  }

  async getCurrentConditions(params: CurrentParams): Promise<ApiResponse<CurrentWeather>> {
    return this.request('/getUltraSrtNcst', {
      base_date: params.baseDate,
      base_time: params.baseTime,
      nx: params.nx,
      ny: params.ny,
      dataType: 'JSON',
    });
  }

  async getUltraShortForecast(params: CurrentParams): Promise<ApiResponse<ForecastItem[]>> {
    return this.request('/getUltraSrtFcst', {
      base_date: params.baseDate,
      base_time: params.baseTime,
      nx: params.nx,
      ny: params.ny,
      dataType: 'JSON',
    });
  }

  // Convenience method: Auto base date/time
  async getForecastForLocation(nx: number, ny: number): Promise<ApiResponse<ForecastItem[]>> {
    const { baseDate, baseTime } = this.getLatestBaseDateTime();
    return this.getForecast({ baseDate, baseTime, nx, ny });
  }

  // Coordinate conversion
  convertCoordinates(lat: number, lng: number): { nx: number; ny: number } {
    return convertToGrid(lat, lng);
  }

  private getLatestBaseDateTime(): { baseDate: string; baseTime: string } {
    const now = new Date();
    const baseTimes = ['0200', '0500', '0800', '1100', '1400', '1700', '2000', '2300'];
    // ... implementation
    return { baseDate: this.formatDate(now), baseTime: baseTimes[0] };
  }
}
```

#### 4.7.2 BusinessAdapter

**[SRS-BIZ-001~005]**

```typescript
// src/adapters/business/index.ts
import { BaseAdapter } from '../base';
import { StatusParams, VerifyParams, BusinessStatus, VerifyResult } from './types';
import { validateBusinessNumber, validateChecksum } from './validator';

export class BusinessAdapter extends BaseAdapter {
  readonly name = 'business';
  readonly baseUrl = 'https://api.odcloud.kr/api/nts-businessman/v1';
  readonly provider = '국세청';
  readonly defaultTTL = 86400; // 24 hours
  readonly serviceKeyParam = 'serviceKey';

  async getStatus(params: StatusParams): Promise<ApiResponse<BusinessStatus>> {
    const bizNo = this.normalizeBusinessNumber(params.businessNumber);
    validateBusinessNumber(bizNo);

    return this.request('/status', {}, {
      method: 'POST',
      body: { b_no: [bizNo] },
    });
  }

  async getStatusBatch(businessNumbers: string[]): Promise<ApiResponse<BusinessStatus[]>> {
    if (businessNumbers.length > 100) {
      throw new ValidationError('Maximum 100 business numbers per request');
    }

    const normalizedNumbers = businessNumbers.map(this.normalizeBusinessNumber);
    normalizedNumbers.forEach(validateBusinessNumber);

    return this.request('/status', {}, {
      method: 'POST',
      body: { b_no: normalizedNumbers },
    });
  }

  async verify(params: VerifyParams): Promise<ApiResponse<VerifyResult>> {
    const bizNo = this.normalizeBusinessNumber(params.businessNumber);
    validateBusinessNumber(bizNo);

    return this.request('/validate', {}, {
      method: 'POST',
      body: {
        businesses: [{
          b_no: bizNo,
          start_dt: params.startDate,
          p_nm: params.representativeName,
          b_nm: params.companyName || '',
        }],
      },
    });
  }

  // Convenience methods
  async isActive(businessNumber: string): Promise<boolean> {
    const response = await this.getStatus({ businessNumber });
    return response.items[0]?.status?.code === '01';
  }

  validateChecksum(businessNumber: string): boolean {
    return validateChecksum(this.normalizeBusinessNumber(businessNumber));
  }

  private normalizeBusinessNumber(bizNo: string): string {
    return bizNo.replace(/[^0-9]/g, '');
  }
}
```

#### 4.7.3 AddressAdapter

**[SRS-ADDR-001~004]**

```typescript
// src/adapters/address/index.ts
import { BaseAdapter } from '../base';
import { SearchParams, CoordParams, AddressResult, Coordinates } from './types';

export class AddressAdapter extends BaseAdapter {
  readonly name = 'address';
  readonly baseUrl = 'https://business.juso.go.kr/addrlink';
  readonly provider = '행정안전부';
  readonly defaultTTL = 604800; // 7 days
  readonly serviceKeyParam = 'confmKey';

  async search(params: SearchParams): Promise<ApiResponse<AddressResult[]>> {
    return this.request('/addrLinkApi.do', {
      keyword: params.keyword,
      currentPage: params.page || 1,
      countPerPage: params.pageSize || 10,
      resultType: 'json',
      hstryYn: params.includeHistory ? 'Y' : 'N',
    });
  }

  async getCoordinates(params: CoordParams): Promise<ApiResponse<Coordinates>> {
    return this.request('/coordApi.do', {
      admCd: params.admCd,
      rnMgtSn: params.rnMgtSn,
      udrtYn: params.udrtYn,
      buldMnnm: params.buldMnnm,
      buldSlno: params.buldSlno,
      resultType: 'json',
    });
  }

  async searchEnglish(params: SearchParams): Promise<ApiResponse<AddressResult[]>> {
    return this.request('/addrEngApi.do', {
      keyword: params.keyword,
      currentPage: params.page || 1,
      countPerPage: params.pageSize || 10,
      resultType: 'json',
    });
  }

  // Convenience method
  async getZipCode(address: string): Promise<string | null> {
    const response = await this.search({ keyword: address, pageSize: 1 });
    return response.items[0]?.zipNo || null;
  }
}
```

---

## 5. Interface Design

### 5.1 Public API Interface

**[SRS-CORE-001~005]**

```typescript
// src/types/public-api.ts

/**
 * SDK Configuration
 */
export interface SDKConfig {
  /** Public data portal service key */
  serviceKey?: string;

  /** Account type (affects rate limits) */
  accountType?: 'development' | 'production';

  /** Default response format */
  dataType?: 'JSON' | 'XML';

  /** Cache configuration */
  cache?: Partial<CacheConfig>;

  /** Retry configuration */
  retry?: Partial<RetryConfig>;

  /** Circuit breaker configuration */
  circuitBreaker?: Partial<CircuitBreakerConfig>;

  /** Logging configuration */
  logging?: Partial<LoggingConfig>;

  /** HTTP configuration */
  http?: Partial<HttpConfig>;
}

/**
 * Resolved configuration with all defaults applied
 */
export interface ResolvedConfig {
  serviceKey: string;
  accountType: 'development' | 'production';
  dataType: 'JSON' | 'XML';
  cache: CacheConfig;
  retry: RetryConfig;
  circuitBreaker: CircuitBreakerConfig;
  logging: LoggingConfig;
  http: HttpConfig;
}
```

### 5.2 Response Interface

```typescript
// src/types/response.ts

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  /** Whether the request was successful */
  success: boolean;

  /** Response data items */
  items: T[];

  /** Pagination information (if applicable) */
  pagination?: PaginationInfo;

  /** Response metadata */
  meta?: ResponseMeta;

  /** Original raw response (for debugging) */
  raw: unknown;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface ResponseMeta {
  requestId?: string;
  timestamp: string;
  duration: number;
  cached: boolean;
}
```

### 5.3 Adapter Interfaces

```typescript
// Weather types
export interface ForecastParams {
  baseDate: string;
  baseTime: string;
  nx: number;
  ny: number;
  pageNo?: number;
  numOfRows?: number;
}

export interface ForecastItem {
  baseDate: string;
  baseTime: string;
  fcstDate: string;
  fcstTime: string;
  category: string;
  fcstValue: string;
  nx: number;
  ny: number;
}

// Business types
export interface StatusParams {
  businessNumber: string;
}

export interface BusinessStatus {
  businessNumber: string;
  status: {
    code: '01' | '02' | '03';
    description: string;
  };
  taxType: {
    code: string;
    description: string;
  };
  closedDate?: string;
}

// Address types
export interface SearchParams {
  keyword: string;
  page?: number;
  pageSize?: number;
  includeHistory?: boolean;
}

export interface AddressResult {
  roadAddress: string;
  jibunAddress: string;
  englishAddress: string;
  zipCode: string;
  buildingName?: string;
  district: {
    sido: string;
    sigungu: string;
    dong: string;
  };
}
```

---

## 6. Data Design

### 6.1 Configuration Data Model

```typescript
interface CacheConfig {
  enabled: boolean;
  adapter: 'memory' | 'redis';
  defaultTTL: number;      // seconds
  maxSize: number;         // memory only
  redis?: {
    url: string;
    keyPrefix: string;
  };
}

interface RetryConfig {
  maxAttempts: number;     // 1-10
  initialDelay: number;    // ms
  maxDelay: number;        // ms
  backoffMultiplier: number;
  jitter: boolean;
}

interface CircuitBreakerConfig {
  enabled: boolean;
  threshold: number;       // failures before open
  resetTimeout: number;    // ms before half-open
  windowDuration: number;  // ms for failure counting
}
```

### 6.2 Cache Entry Model

```typescript
interface CacheEntry<T> {
  key: string;
  value: T;
  ttl: number;
  createdAt: number;
  expiresAt: number;
  metadata?: {
    adapter: string;
    endpoint: string;
    hits: number;
  };
}
```

### 6.3 Default TTL by Adapter

| Adapter | TTL (seconds) | Rationale |
|---------|---------------|-----------|
| weather | 3,600 | Hourly updates |
| business | 86,400 | Rarely changes |
| address | 604,800 | Very stable |
| holiday | 86,400 | Annual updates |
| transport | 30 | Real-time data |
| airQuality | 1,800 | Hourly updates |
| realEstate | 21,600 | Daily updates |

---

## 7. Error Handling Design

### 7.1 Error Class Hierarchy

**[SRS-ERR-001~009]**

```
PublicDataError (abstract base)
│
├── AuthenticationError
│   └── Used for: Invalid/expired service key
│
├── RateLimitError
│   └── Used for: API rate limit exceeded
│
├── ValidationError
│   └── Used for: Invalid input parameters
│
├── NotFoundError
│   └── Used for: No data found
│
├── ServiceUnavailableError
│   └── Used for: API server errors
│
├── NetworkError
│   └── Used for: Connection/timeout issues
│
├── ParseError
│   └── Used for: Invalid response format
│
└── CircuitOpenError
    └── Used for: Circuit breaker is open
```

### 7.2 Error Implementation

```typescript
// src/core/errors.ts

export abstract class PublicDataError extends Error {
  abstract readonly code: string;
  abstract readonly retryable: boolean;

  readonly statusCode?: number;
  readonly originalError?: Error;
  readonly context: Record<string, unknown>;

  constructor(
    message: string,
    options: {
      statusCode?: number;
      originalError?: Error;
      context?: Record<string, unknown>;
    } = {}
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = options.statusCode;
    this.originalError = options.originalError;
    this.context = options.context || {};

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      retryable: this.retryable,
      statusCode: this.statusCode,
      context: this.context,
    };
  }
}

export class AuthenticationError extends PublicDataError {
  readonly code = 'AUTH_ERROR';
  readonly retryable = false;
}

export class RateLimitError extends PublicDataError {
  readonly code = 'RATE_LIMIT';
  readonly retryable = true;
  readonly retryAfter?: number;
}

export class ValidationError extends PublicDataError {
  readonly code = 'VALIDATION_ERROR';
  readonly retryable = false;
}

export class NotFoundError extends PublicDataError {
  readonly code = 'NOT_FOUND';
  readonly retryable = false;
}

export class ServiceUnavailableError extends PublicDataError {
  readonly code = 'SERVICE_UNAVAILABLE';
  readonly retryable = true;
}

export class NetworkError extends PublicDataError {
  readonly code = 'NETWORK_ERROR';
  readonly retryable = true;
}

export class ParseError extends PublicDataError {
  readonly code = 'PARSE_ERROR';
  readonly retryable = false;
}

export class CircuitOpenError extends PublicDataError {
  readonly code = 'CIRCUIT_OPEN';
  readonly retryable = false;
}
```

### 7.3 Error Code Mapping

| API Error Code | SDK Error Class |
|----------------|-----------------|
| 00 | (No error) |
| 01, 02, 04, 05, 12 | ServiceUnavailableError |
| 03 | NotFoundError |
| 10, 11 | ValidationError |
| 21 | RateLimitError |
| 22, 30, 31 | AuthenticationError |
| E0001, E0011 | AuthenticationError |
| E0005, E0006, E0010 | ValidationError |
| E0014 | RateLimitError |

---

## 8. Security Design

### 8.1 Service Key Protection

**[SRS-SEC-001]**

```typescript
// src/utils/security.ts

export function maskServiceKey(key: string): string {
  if (!key || key.length <= 8) {
    return '****';
  }
  return `${key.substring(0, 4)}****${key.substring(key.length - 4)}`;
}

// Used in logging
logger.info('Request to API', {
  url: url,
  serviceKey: maskServiceKey(config.serviceKey), // AbCd****xYzW
});
```

### 8.2 HTTPS Enforcement

**[SRS-SEC-002]**

```typescript
// In HttpClient
private validateUrl(url: string): void {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:') {
    throw new ValidationError('Only HTTPS URLs are allowed');
  }
}
```

### 8.3 Input Validation

**[SRS-SEC-003]**

```typescript
// src/utils/validation.ts

export function sanitizeParams(params: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      // Remove potential injection patterns
      sanitized[key] = value
        .replace(/[<>]/g, '')  // Basic XSS prevention
        .trim();
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export function validateBusinessNumber(bizNo: string): void {
  if (!/^\d{10}$/.test(bizNo)) {
    throw new ValidationError('Business number must be 10 digits');
  }
}
```

---

## Appendix

### A. Design Decisions

| Decision | Rationale | Alternative Considered |
|----------|-----------|------------------------|
| Native fetch | Zero dependencies, standard API | axios, got |
| fast-xml-parser | Lightweight, fast | xml2js |
| Lazy adapter loading | Memory efficiency | Eager loading |
| LRU cache | Simple, effective | LFU, ARC |
| SHA-256 for cache keys | Collision resistance | MD5, simple hash |

### B. SRS → SDS Complete Mapping

| SRS ID | SDS Section | Component |
|--------|-------------|-----------|
| SRS-CORE-001 | 4.1.2 | PublicDataSDK.constructor |
| SRS-CORE-002 | 4.1.2 | PublicDataSDK.resolveConfig |
| SRS-CORE-003 | 4.1.2 | DEFAULT_CONFIG |
| SRS-CORE-004 | 4.1.2 | PublicDataSDK.validateConfig |
| SRS-CORE-005 | 5.1 | Type exports |
| SRS-HTTP-001 | 4.2.2 | HttpClient.request |
| SRS-HTTP-002 | 4.2.2 | HttpClient.injectServiceKey |
| SRS-HTTP-003 | 4.2.2 | HttpClient.executeWithRetry |
| SRS-HTTP-004 | 4.2.2 | HttpClient.getRetryDelay |
| SRS-HTTP-005 | 4.2.2 | HttpClient.executeRequest |
| SRS-PARSE-001 | 4.3.2 | ResponseParser.parseJson |
| SRS-PARSE-002 | 4.3.2 | ResponseParser.parseXml |
| SRS-PARSE-003 | 4.3.2 | ResponseParser.normalize |
| SRS-PARSE-004 | 4.3.2 | ResponseParser.extractError |
| SRS-CACHE-001 | 4.4.2 | MemoryCacheAdapter |
| SRS-CACHE-002 | 6.3 | Default TTL table |
| SRS-CACHE-003 | 4.4.2 | CacheManager.generateKey |
| SRS-CACHE-004 | 4.4.2 | RedisCacheAdapter |
| SRS-CACHE-005 | 4.4.2 | CacheManager.delete/clear |
| SRS-CB-001 | 4.5.2 | CircuitBreaker.onFailure |
| SRS-CB-002 | 4.5.1 | State machine diagram |
| SRS-CB-003 | 4.1.2 | Per-adapter circuit breakers |
| SRS-CB-004 | 4.5.2 | CircuitBreaker events |
| SRS-ERR-001~009 | 7.2 | Error classes |
| SRS-WTH-001~005 | 4.7.1 | WeatherAdapter |
| SRS-BIZ-001~005 | 4.7.2 | BusinessAdapter |
| SRS-ADDR-001~004 | 4.7.3 | AddressAdapter |
| SRS-SEC-001~004 | 8 | Security module |

---

## Document Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Author | | | |
| Reviewer | | | |
| Approver | | | |
