# Software Requirements Specification (SRS)

# 대한민국 공공데이터 범용 SDK

> **Document Version**: 1.0.0
> **Created**: 2026-02-05
> **Last Updated**: 2026-02-05
> **Status**: Draft
> **Based on**: PRD v1.0.0

---

## Document Control

### Revision History

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0.0 | 2026-02-05 | SDK Team | Initial release |

### Referenced Documents

| Document | Version | Location |
|----------|---------|----------|
| PRD | 1.0.0 | [docs/PRD.md](./PRD.md) |
| SDK Architecture | 1.0.0 | [sdk/docs/design/sdk-architecture.md](./sdk/docs/design/sdk-architecture.md) |
| TypeScript Interfaces | 1.0.0 | [sdk/docs/interfaces/typescript-interfaces.md](./sdk/docs/interfaces/typescript-interfaces.md) |
| API Specifications | 1.0.0 | [sdk/docs/api-specs/](./sdk/docs/api-specs/) |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Overall Description](#2-overall-description)
3. [Traceability Matrix](#3-traceability-matrix)
4. [System Features](#4-system-features)
5. [External Interface Requirements](#5-external-interface-requirements)
6. [Functional Requirements](#6-functional-requirements)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [Data Requirements](#8-data-requirements)
9. [Use Case Specifications](#9-use-case-specifications)
10. [Appendix](#10-appendix)

---

## 1. Introduction

### 1.1 Purpose

본 문서는 대한민국 공공데이터 범용 SDK의 소프트웨어 요구사항 명세서(SRS)입니다. PRD에서 정의된 제품 요구사항을 기술적 요구사항으로 상세화하고, 개발팀이 구현할 수 있는 수준의 명세를 제공합니다.

### 1.2 Scope

| Item | Description |
|------|-------------|
| **Product Name** | Public Data SDK (공공데이터 SDK) |
| **Product Type** | TypeScript/JavaScript Library (npm package) |
| **Target Platform** | Node.js 18+ |
| **Delivery Format** | npm package (ESM/CJS dual) |

### 1.3 Definitions, Acronyms, and Abbreviations

| Term | Definition |
|------|------------|
| **SDK** | Software Development Kit |
| **SRS** | Software Requirements Specification |
| **PRD** | Product Requirements Document |
| **API** | Application Programming Interface |
| **Adapter** | API별 인터페이스 변환 컴포넌트 |
| **Circuit Breaker** | 연속 실패 시 요청을 차단하는 설계 패턴 |
| **TTL** | Time To Live (캐시 만료 시간) |
| **CAI** | Comprehensive Air-quality Index |
| **LAWD_CD** | 법정동 코드 (5자리) |
| **TM** | Transverse Mercator (좌표계) |

### 1.4 Document Conventions

#### Requirement ID Format

```
SRS-[Category]-[Number]

Categories:
- CORE  : 핵심 기능
- HTTP  : HTTP 클라이언트
- PARSE : 응답 파싱
- CACHE : 캐싱
- CB    : Circuit Breaker
- ERR   : 에러 처리
- ADAPT : 어댑터 공통
- WTH   : Weather 어댑터
- BIZ   : Business 어댑터
- ADDR  : Address 어댑터
- HLDY  : Holiday 어댑터
- TRNS  : Transport 어댑터
- AIR   : Air Quality 어댑터
- RE    : Real Estate 어댑터
- PERF  : 성능
- SEC   : 보안
- COMPAT: 호환성
```

#### Priority Levels

| Priority | Description | Implementation |
|----------|-------------|----------------|
| **P0** | Must Have | MVP에 반드시 포함 |
| **P1** | Should Have | 1.0 릴리즈에 포함 |
| **P2** | Nice to Have | 후속 버전에서 고려 |

#### Traceability Notation

```
[PRD: FR-001, US-002]  → PRD의 Functional Requirement 및 User Story 참조
[PRD: NFR-010]         → PRD의 Non-Functional Requirement 참조
[PRD: G1]              → PRD의 Goal 참조
```

---

## 2. Overall Description

### 2.1 Product Perspective

```
┌────────────────────────────────────────────────────────────────────────┐
│                         User Application                               │
│                    (Node.js Backend / Next.js / etc.)                  │
└───────────────────────────────┬────────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Public Data SDK                                 │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                      SDK Public API                              │  │
│  │   • PublicDataSDK class                                          │  │
│  │   • Adapter accessors (sdk.weather, sdk.business, etc.)          │  │
│  │   • Configuration types                                          │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                      Adapter Layer                               │  │
│  │   Weather │ Business │ Address │ Holiday │ Transport │ ...      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                       Core Layer                                 │  │
│  │   HttpClient │ Parser │ CacheManager │ CircuitBreaker │ Errors  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬────────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    Public Data APIs (External)                         │
│   data.go.kr │ api.odcloud.kr │ juso.go.kr │ apis.data.go.kr          │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Product Functions Summary

| Function | Description | PRD Reference |
|----------|-------------|---------------|
| SDK Initialization | 서비스 키 기반 SDK 인스턴스 생성 | FR-001 |
| API Request | 통합 인터페이스로 API 호출 | FR-002, FR-003 |
| Response Parsing | XML/JSON 자동 파싱 및 정규화 | FR-004 |
| Retry Logic | 실패 시 자동 재시도 | FR-005 |
| Circuit Breaker | 연속 실패 시 차단 | FR-006 |
| Caching | 응답 캐싱 및 TTL 관리 | FR-007 |
| Error Handling | 통합 에러 처리 | FR-020 |
| Weather API | 기상청 날씨 정보 조회 | FR-010 |
| Business API | 국세청 사업자등록 확인 | FR-011 |
| Address API | 도로명주소 검색 | FR-012 |
| Holiday API | 공휴일 정보 조회 | FR-013 |
| Transport API | 대중교통 정보 조회 | FR-014 |
| Air Quality API | 대기오염 정보 조회 | FR-015 |
| Real Estate API | 부동산 실거래가 조회 | FR-016 |

### 2.3 User Characteristics

| User Type | Technical Level | Primary Use Case |
|-----------|-----------------|------------------|
| Backend Developer | Advanced | 서버 사이드 데이터 수집/가공 |
| Full-Stack Developer | Intermediate | BFF API 구축 |
| Data Engineer | Advanced | 데이터 파이프라인 구축 |
| Startup Developer | Intermediate | MVP 빠른 개발 |

### 2.4 Constraints

| Constraint | Description | Impact |
|------------|-------------|--------|
| CORS 미지원 | 대부분의 공공 API가 CORS 미지원 | 브라우저 직접 호출 불가 |
| Rate Limit | 개발 계정 1,000건/일 제한 | 개발 환경에서 제약 |
| API 가용성 | 공공 API SLA 99.5% 수준 | 장애 대비 필요 |
| 응답 형식 | API별 XML/JSON 혼재 | 파서 복잡도 증가 |
| 키 발급 지연 | 서비스 키 발급 최대 2시간 | 즉시 테스트 불가 |

### 2.5 Assumptions and Dependencies

#### Assumptions

| ID | Assumption |
|----|------------|
| A1 | 사용자는 유효한 공공데이터포털 서비스 키를 보유함 |
| A2 | 사용자 환경은 외부 네트워크 접근이 가능함 |
| A3 | Node.js 18 이상 버전이 설치되어 있음 |
| A4 | 공공 API의 기본 스펙은 크게 변경되지 않음 |

#### Dependencies

| ID | Dependency | Type |
|----|------------|------|
| D1 | Node.js 18+ Runtime | External |
| D2 | fast-xml-parser npm package | External |
| D3 | data.go.kr API Gateway | External |
| D4 | 개별 기관 API 서버 | External |
| D5 | ioredis (optional) | External |

---

## 3. Traceability Matrix

### 3.1 PRD Goals → SRS Requirements

| PRD Goal | Description | SRS Requirements |
|----------|-------------|------------------|
| **G1: 통합성** | 다양한 API를 단일 인터페이스로 | SRS-CORE-001~003, SRS-ADAPT-001~005 |
| **G2: 안정성** | 프로덕션 환경 안정적 운영 | SRS-HTTP-003~005, SRS-CB-001~004 |
| **G3: 사용성** | 최소 설정으로 바로 사용 | SRS-CORE-001~002, SRS-CORE-004 |
| **G4: 타입안전** | 완전한 TypeScript 지원 | SRS-CORE-005, SRS-COMPAT-003 |
| **G5: 확장성** | 새 API 추가 용이 | SRS-ADAPT-001~003 |

### 3.2 PRD User Stories → SRS Requirements

| PRD User Story | Description | SRS Requirements |
|----------------|-------------|------------------|
| **US-001** | SDK 초기화 | SRS-CORE-001~004 |
| **US-002** | 날씨 정보 조회 | SRS-WTH-001~005 |
| **US-003** | 사업자등록 확인 | SRS-BIZ-001~005 |
| **US-004** | 주소 검색 | SRS-ADDR-001~004 |
| **US-005** | 에러 핸들링 | SRS-ERR-001~009 |
| **US-006** | 캐싱 | SRS-CACHE-001~005 |
| **US-007** | 공휴일 조회 | SRS-HLDY-001~004 |
| **US-008** | 대중교통 정보 | SRS-TRNS-001~004 |
| **US-009** | 대기질 정보 | SRS-AIR-001~004 |
| **US-010** | 부동산 실거래가 | SRS-RE-001~004 |

### 3.3 PRD Functional Requirements → SRS Requirements

| PRD FR | Description | SRS Requirements |
|--------|-------------|------------------|
| **FR-001** | SDK Initialization | SRS-CORE-001~004 |
| **FR-002** | Adapter Registry | SRS-ADAPT-001~003 |
| **FR-003** | HTTP Client | SRS-HTTP-001~005 |
| **FR-004** | Response Parser | SRS-PARSE-001~004 |
| **FR-005** | Retry Logic | SRS-HTTP-003~005 |
| **FR-006** | Circuit Breaker | SRS-CB-001~004 |
| **FR-007** | Cache Manager | SRS-CACHE-001~005 |
| **FR-010** | Weather Adapter | SRS-WTH-001~005 |
| **FR-011** | Business Adapter | SRS-BIZ-001~005 |
| **FR-012** | Address Adapter | SRS-ADDR-001~004 |
| **FR-013** | Holiday Adapter | SRS-HLDY-001~004 |
| **FR-014** | Transport Adapter | SRS-TRNS-001~004 |
| **FR-015** | Air Quality Adapter | SRS-AIR-001~004 |
| **FR-016** | Real Estate Adapter | SRS-RE-001~004 |
| **FR-020** | Error Types | SRS-ERR-001~009 |

### 3.4 PRD Non-Functional Requirements → SRS Requirements

| PRD NFR | Description | SRS Requirements |
|---------|-------------|------------------|
| **NFR-001~005** | Performance | SRS-PERF-001~005 |
| **NFR-010~013** | Reliability | SRS-CB-001~004, SRS-HTTP-003~005 |
| **NFR-020~023** | Usability | SRS-CORE-004~005 |
| **NFR-030~033** | Security | SRS-SEC-001~004 |
| **NFR-040~043** | Maintainability | SRS-ADAPT-001~003 |
| **NFR-050~053** | Compatibility | SRS-COMPAT-001~004 |

### 3.5 Complete Traceability Matrix

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        TRACEABILITY MATRIX                                      │
├─────────────┬──────────────┬───────────────────┬────────────────────────────────┤
│ PRD Goal    │ PRD US/FR    │ SRS Requirement   │ Test Case (TBD)                │
├─────────────┼──────────────┼───────────────────┼────────────────────────────────┤
│ G1, G3      │ US-001       │ SRS-CORE-001      │ TC-CORE-001                    │
│             │ FR-001.1     │ SRS-CORE-002      │ TC-CORE-002                    │
│             │ FR-001.2     │ SRS-CORE-003      │ TC-CORE-003                    │
│             │ FR-001.3     │ SRS-CORE-004      │ TC-CORE-004                    │
├─────────────┼──────────────┼───────────────────┼────────────────────────────────┤
│ G1          │ FR-002.1     │ SRS-ADAPT-001     │ TC-ADAPT-001                   │
│             │ FR-002.2     │ SRS-ADAPT-002     │ TC-ADAPT-002                   │
│ G5          │ FR-002.3     │ SRS-ADAPT-003     │ TC-ADAPT-003                   │
├─────────────┼──────────────┼───────────────────┼────────────────────────────────┤
│ G2          │ FR-003.1     │ SRS-HTTP-001      │ TC-HTTP-001                    │
│             │ FR-003.2     │ SRS-HTTP-002      │ TC-HTTP-002                    │
│             │ FR-005.1-4   │ SRS-HTTP-003~005  │ TC-HTTP-003~005                │
├─────────────┼──────────────┼───────────────────┼────────────────────────────────┤
│ G1          │ FR-004.1-4   │ SRS-PARSE-001~004 │ TC-PARSE-001~004               │
├─────────────┼──────────────┼───────────────────┼────────────────────────────────┤
│ G2          │ US-006       │ SRS-CACHE-001~005 │ TC-CACHE-001~005               │
│             │ FR-007.1-5   │                   │                                │
├─────────────┼──────────────┼───────────────────┼────────────────────────────────┤
│ G2          │ FR-006.1-4   │ SRS-CB-001~004    │ TC-CB-001~004                  │
├─────────────┼──────────────┼───────────────────┼────────────────────────────────┤
│ G2          │ US-005       │ SRS-ERR-001~009   │ TC-ERR-001~009                 │
│             │ FR-020.1-9   │                   │                                │
├─────────────┼──────────────┼───────────────────┼────────────────────────────────┤
│ G1          │ US-002       │ SRS-WTH-001~005   │ TC-WTH-001~005                 │
│             │ FR-010.1-5   │                   │                                │
├─────────────┼──────────────┼───────────────────┼────────────────────────────────┤
│ G1          │ US-003       │ SRS-BIZ-001~005   │ TC-BIZ-001~005                 │
│             │ FR-011.1-5   │                   │                                │
├─────────────┼──────────────┼───────────────────┼────────────────────────────────┤
│ G1          │ US-004       │ SRS-ADDR-001~004  │ TC-ADDR-001~004                │
│             │ FR-012.1-4   │                   │                                │
├─────────────┼──────────────┼───────────────────┼────────────────────────────────┤
│ G1          │ US-007       │ SRS-HLDY-001~004  │ TC-HLDY-001~004                │
│             │ FR-013.1-4   │                   │                                │
├─────────────┼──────────────┼───────────────────┼────────────────────────────────┤
│ G1          │ US-008       │ SRS-TRNS-001~004  │ TC-TRNS-001~004                │
│             │ FR-014.1-4   │                   │                                │
├─────────────┼──────────────┼───────────────────┼────────────────────────────────┤
│ G1          │ US-009       │ SRS-AIR-001~004   │ TC-AIR-001~004                 │
│             │ FR-015.1-4   │                   │                                │
├─────────────┼──────────────┼───────────────────┼────────────────────────────────┤
│ G1          │ US-010       │ SRS-RE-001~004    │ TC-RE-001~004                  │
│             │ FR-016.1-4   │                   │                                │
└─────────────┴──────────────┴───────────────────┴────────────────────────────────┘
```

---

## 4. System Features

### 4.1 Feature: SDK Core (SF-001)

**Description**: SDK의 핵심 기능으로, 초기화, 설정 관리, 어댑터 레지스트리를 포함합니다.

**Priority**: P0

**PRD References**: FR-001, FR-002, US-001, G1, G3

#### 4.1.1 Stimulus/Response Sequences

```
┌─────────┐                    ┌─────────────────┐
│  User   │                    │  PublicDataSDK  │
└────┬────┘                    └────────┬────────┘
     │                                  │
     │  new PublicDataSDK(config)       │
     │ ─────────────────────────────────>
     │                                  │
     │                   ┌──────────────┴──────────────┐
     │                   │ 1. Validate config          │
     │                   │ 2. Resolve defaults         │
     │                   │ 3. Initialize core modules  │
     │                   │ 4. Register adapters        │
     │                   └──────────────┬──────────────┘
     │                                  │
     │  <SDK Instance>                  │
     │ <─────────────────────────────────
     │                                  │
     │  sdk.weather.getForecast(...)    │
     │ ─────────────────────────────────>
     │                                  │
     │  <Promise<ForecastResponse>>     │
     │ <─────────────────────────────────
```

### 4.2 Feature: HTTP Client with Retry (SF-002)

**Description**: 재시도 로직이 내장된 HTTP 클라이언트

**Priority**: P0

**PRD References**: FR-003, FR-005, G2

#### 4.2.1 Stimulus/Response Sequences

```
┌─────────────┐      ┌────────────┐      ┌─────────────┐
│   Adapter   │      │ HttpClient │      │ External API│
└──────┬──────┘      └─────┬──────┘      └──────┬──────┘
       │                   │                    │
       │  request(config)  │                    │
       │ ─────────────────>│                    │
       │                   │                    │
       │                   │  HTTP Request      │
       │                   │ ──────────────────>│
       │                   │                    │
       │                   │  500 Error         │
       │                   │ <──────────────────│
       │                   │                    │
       │          ┌────────┴────────┐           │
       │          │ Wait (backoff)  │           │
       │          └────────┬────────┘           │
       │                   │                    │
       │                   │  Retry Request     │
       │                   │ ──────────────────>│
       │                   │                    │
       │                   │  200 OK + Data     │
       │                   │ <──────────────────│
       │                   │                    │
       │  <Response>       │                    │
       │ <─────────────────│                    │
```

### 4.3 Feature: Response Parser (SF-003)

**Description**: XML/JSON 응답 자동 파싱 및 정규화

**Priority**: P0

**PRD References**: FR-004, G1

### 4.4 Feature: Cache Manager (SF-004)

**Description**: 응답 캐싱 및 TTL 관리

**Priority**: P0/P1

**PRD References**: FR-007, US-006, G2

### 4.5 Feature: Circuit Breaker (SF-005)

**Description**: 연속 실패 시 서비스 보호

**Priority**: P1

**PRD References**: FR-006, G2

### 4.6 Feature: Error Handling (SF-006)

**Description**: 통합 에러 타입 및 처리

**Priority**: P0

**PRD References**: FR-020, US-005, G2

### 4.7~4.13 Feature: API Adapters (SF-007~SF-013)

각 API 어댑터는 Section 6에서 상세 명세합니다.

---

## 5. External Interface Requirements

### 5.1 User Interfaces

해당 없음 (Library/SDK)

### 5.2 Software Interfaces

#### 5.2.1 Node.js Runtime

| Item | Specification |
|------|---------------|
| **Interface Type** | Runtime Environment |
| **Version** | 18.0.0+ |
| **Required Features** | Native fetch, ESM support |

#### 5.2.2 npm Package Manager

| Item | Specification |
|------|---------------|
| **Interface Type** | Package Distribution |
| **Versions** | npm 8+, yarn 1.22+, pnpm 7+ |
| **Package Format** | ESM + CJS dual package |

### 5.3 Hardware Interfaces

해당 없음 (Software Library)

### 5.4 Communication Interfaces

#### 5.4.1 Public Data API Gateway

| Item | Specification |
|------|---------------|
| **Protocol** | HTTPS (TLS 1.2+) |
| **Data Format** | JSON, XML |
| **Authentication** | Query Parameter (serviceKey) |
| **Timeout** | 30 seconds (configurable) |

```
┌─────────────────────────────────────────────────────────────────┐
│                  API Communication Flow                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SDK ─────[HTTPS GET/POST]─────> API Gateway (data.go.kr)      │
│                                        │                        │
│                                        ▼                        │
│                               Individual API Servers            │
│                               (기상청, 국세청, etc.)             │
│                                        │                        │
│  SDK <────[JSON/XML Response]──────────┘                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 5.4.2 External API Endpoints

| API | Base URL | Protocol |
|-----|----------|----------|
| Weather | `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0` | GET |
| Business | `https://api.odcloud.kr/api/nts-businessman/v1` | POST |
| Address | `https://business.juso.go.kr/addrlink` | GET |
| Holiday | `https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService` | GET |
| Transport | `https://apis.data.go.kr/1613000` | GET |
| Air Quality | `https://apis.data.go.kr/B552584/ArpltnInforInqireSvc` | GET |
| Real Estate | `https://apis.data.go.kr/1613000/RTMSDataSvc*` | GET |

---

## 6. Functional Requirements

### 6.1 Core Module Requirements

#### SRS-CORE-001: SDK Instance Creation

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-CORE-001 |
| **Title** | SDK 인스턴스 생성 |
| **Priority** | P0 |
| **PRD Trace** | FR-001.1, US-001, G3 |

**Description**:
사용자는 `PublicDataSDK` 클래스를 인스턴스화하여 SDK를 사용할 수 있어야 한다.

**Input**:
```typescript
interface SDKConfig {
  serviceKey: string;           // Required
  accountType?: 'development' | 'production';
  dataType?: 'JSON' | 'XML';
  cache?: CacheConfig;
  retry?: RetryConfig;
  circuitBreaker?: CircuitBreakerConfig;
  logging?: LoggingConfig;
  http?: HttpConfig;
}
```

**Processing**:
1. `serviceKey`가 없으면 환경변수 `PUBLIC_DATA_API_KEY`에서 로드
2. 설정값 유효성 검증
3. 기본값과 사용자 설정 병합
4. Core 모듈 초기화 (HttpClient, Parser, CacheManager, CircuitBreaker)
5. 어댑터 레지스트리 초기화

**Output**:
- 성공: `PublicDataSDK` 인스턴스
- 실패: `ValidationError` 예외

**Acceptance Criteria**:
- [ ] 서비스 키만으로 SDK 생성 가능
- [ ] 환경변수에서 자동 키 로드
- [ ] 잘못된 설정 시 명확한 에러 메시지
- [ ] 모든 설정 옵션에 기본값 존재

---

#### SRS-CORE-002: Environment Variable Loading

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-CORE-002 |
| **Title** | 환경변수 자동 로딩 |
| **Priority** | P0 |
| **PRD Trace** | FR-001.2, US-001 |

**Description**:
`serviceKey`가 명시적으로 제공되지 않은 경우, 환경변수에서 자동으로 로드한다.

**Environment Variables**:
| Variable | Purpose | Default |
|----------|---------|---------|
| `PUBLIC_DATA_API_KEY` | Service Key | - |
| `PUBLIC_DATA_LOG_LEVEL` | Logging Level | `info` |
| `PUBLIC_DATA_CACHE_REDIS_URL` | Redis URL | - |

**Processing**:
```
1. Check config.serviceKey exists
2. If not, read process.env.PUBLIC_DATA_API_KEY
3. If still not found, throw ValidationError
```

**Acceptance Criteria**:
- [ ] 환경변수에서 서비스 키 로드
- [ ] 명시적 설정이 환경변수보다 우선
- [ ] 키 미설정 시 명확한 에러

---

#### SRS-CORE-003: Configuration Resolution

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-CORE-003 |
| **Title** | 설정 해석 및 병합 |
| **Priority** | P0 |
| **PRD Trace** | FR-001.3 |

**Description**:
사용자 설정과 기본값을 병합하여 최종 설정을 생성한다.

**Default Configuration**:
```typescript
const DEFAULT_CONFIG: Partial<SDKConfig> = {
  accountType: 'development',
  dataType: 'JSON',
  cache: {
    enabled: true,
    adapter: 'memory',
    defaultTTL: 3600,
    maxSize: 1000
  },
  retry: {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true
  },
  circuitBreaker: {
    enabled: true,
    threshold: 5,
    resetTimeout: 30000,
    windowDuration: 60000
  },
  logging: {
    level: 'info',
    maskServiceKey: true
  },
  http: {
    timeout: 30000,
    userAgent: 'PublicDataSDK/1.0.0'
  }
};
```

**Acceptance Criteria**:
- [ ] Deep merge of user config and defaults
- [ ] User values override defaults
- [ ] Resolved config is immutable

---

#### SRS-CORE-004: Configuration Validation

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-CORE-004 |
| **Title** | 설정 유효성 검증 |
| **Priority** | P1 |
| **PRD Trace** | FR-001.4 |

**Description**:
설정값의 타입과 범위를 검증한다.

**Validation Rules**:
| Field | Rule |
|-------|------|
| `serviceKey` | Non-empty string |
| `retry.maxAttempts` | Integer, 1-10 |
| `retry.initialDelay` | Integer, 100-10000 |
| `http.timeout` | Integer, 1000-300000 |
| `cache.defaultTTL` | Integer, 0-86400 |

**Error Response**:
```typescript
throw new ValidationError('Invalid configuration', {
  field: 'retry.maxAttempts',
  value: 100,
  constraint: 'must be between 1 and 10'
});
```

---

#### SRS-CORE-005: TypeScript Type Exports

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-CORE-005 |
| **Title** | TypeScript 타입 내보내기 |
| **Priority** | P0 |
| **PRD Trace** | G4, NFR-023 |

**Description**:
모든 public 타입을 export하여 TypeScript 사용자가 타입 안전하게 사용할 수 있도록 한다.

**Export List**:
```typescript
// Main exports
export { PublicDataSDK } from './sdk';
export type { SDKConfig, ResolvedConfig } from './config';

// Adapter types
export type { WeatherAdapter, ForecastParams, ForecastResponse } from './adapters/weather';
export type { BusinessAdapter, StatusParams, VerifyParams } from './adapters/business';
// ... all adapter types

// Core types
export type { ApiResponse, PaginatedResponse } from './types/response';
export type { CacheConfig, RetryConfig } from './types/config';

// Error types
export {
  PublicDataError,
  AuthenticationError,
  RateLimitError,
  ValidationError,
  // ... all error types
} from './core/errors';
```

---

### 6.2 HTTP Client Requirements

#### SRS-HTTP-001: HTTP Request Execution

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-HTTP-001 |
| **Title** | HTTP 요청 실행 |
| **Priority** | P0 |
| **PRD Trace** | FR-003.1 |

**Description**:
HTTP GET/POST 요청을 실행한다.

**Input**:
```typescript
interface HttpRequestConfig {
  method: 'GET' | 'POST';
  url: string;
  params?: Record<string, string | number>;
  body?: unknown;
  headers?: Record<string, string>;
  timeout?: number;
}
```

**Processing**:
1. URL 구성 (base URL + endpoint + query params)
2. 서비스 키 자동 주입
3. fetch API로 요청 실행
4. 응답 처리 (Parser로 전달)

**Output**:
```typescript
interface HttpResponse<T> {
  status: number;
  headers: Headers;
  data: T;
  timing: {
    start: number;
    end: number;
    duration: number;
  };
}
```

---

#### SRS-HTTP-002: Service Key Injection

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-HTTP-002 |
| **Title** | 서비스 키 자동 주입 |
| **Priority** | P0 |
| **PRD Trace** | FR-003.2 |

**Description**:
모든 API 요청에 서비스 키를 자동으로 주입한다.

**Injection Rules**:
| API | Parameter Name | Method |
|-----|----------------|--------|
| Weather | `serviceKey` | Query |
| Business | `serviceKey` | Query |
| Address | `confmKey` | Query |
| Holiday | `serviceKey` | Query |
| Transport | `serviceKey` | Query |
| Air Quality | `serviceKey` | Query |
| Real Estate | `serviceKey` | Query |

**Processing**:
```
1. Get key parameter name from adapter config
2. Inject key into query string (GET) or as query param (POST)
3. URL encode if necessary
```

---

#### SRS-HTTP-003: Retry on Failure

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-HTTP-003 |
| **Title** | 실패 시 재시도 |
| **Priority** | P0 |
| **PRD Trace** | FR-005.1 |

**Description**:
재시도 가능한 에러 발생 시 자동으로 재시도한다.

**Retryable Conditions**:
| Condition | Retry |
|-----------|-------|
| HTTP 5xx | Yes |
| Network Error | Yes |
| Timeout | Yes |
| Rate Limit (429) | Yes (with longer delay) |
| HTTP 4xx (except 429) | No |
| Parse Error | No |
| Auth Error | No |

---

#### SRS-HTTP-004: Exponential Backoff

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-HTTP-004 |
| **Title** | 지수 백오프 |
| **Priority** | P0 |
| **PRD Trace** | FR-005.2 |

**Description**:
재시도 간격을 지수적으로 증가시킨다.

**Algorithm**:
```
delay = min(initialDelay * (backoffMultiplier ^ attempt), maxDelay)
if (jitter) {
  delay = delay * (0.5 + random() * 0.5)
}
```

**Example**:
```
Attempt 1: 1000ms + jitter
Attempt 2: 2000ms + jitter
Attempt 3: 4000ms + jitter
Max: 30000ms
```

---

#### SRS-HTTP-005: Timeout Handling

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-HTTP-005 |
| **Title** | 타임아웃 처리 |
| **Priority** | P0 |
| **PRD Trace** | FR-003.3 |

**Description**:
요청이 지정된 시간 내에 완료되지 않으면 타임아웃 에러를 발생시킨다.

**Default Timeout**: 30,000ms

**Implementation**:
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), timeout);

try {
  const response = await fetch(url, { signal: controller.signal });
  clearTimeout(timeoutId);
  return response;
} catch (error) {
  if (error.name === 'AbortError') {
    throw new NetworkError('Request timeout', { timeout });
  }
  throw error;
}
```

---

### 6.3 Parser Requirements

#### SRS-PARSE-001: JSON Parsing

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-PARSE-001 |
| **Title** | JSON 응답 파싱 |
| **Priority** | P0 |
| **PRD Trace** | FR-004.1 |

**Description**:
JSON 형식의 응답을 파싱한다.

**Processing**:
```typescript
function parseJson<T>(text: string): ParsedResponse<T> {
  try {
    const data = JSON.parse(text);
    return normalizeResponse(data);
  } catch (error) {
    throw new ParseError('Invalid JSON response', { raw: text });
  }
}
```

---

#### SRS-PARSE-002: XML Parsing

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-PARSE-002 |
| **Title** | XML 응답 파싱 |
| **Priority** | P0 |
| **PRD Trace** | FR-004.2 |

**Description**:
XML 형식의 응답을 파싱한다. JSON 요청 시에도 에러 응답이 XML로 올 수 있으므로 자동 감지한다.

**Auto-Detection**:
```typescript
function detectFormat(text: string): 'json' | 'xml' {
  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return 'json';
  }
  if (trimmed.startsWith('<?xml') || trimmed.startsWith('<')) {
    return 'xml';
  }
  throw new ParseError('Unknown response format');
}
```

---

#### SRS-PARSE-003: Response Normalization

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-PARSE-003 |
| **Title** | 응답 정규화 |
| **Priority** | P0 |
| **PRD Trace** | FR-004.3 |

**Description**:
다양한 API 응답 형식을 통일된 형식으로 변환한다.

**Normalization Rules**:

| Source Path | Normalized |
|-------------|------------|
| `response.body.items.item` | `items[]` |
| `response.body.items` (single) | `items[]` (wrapped) |
| `response.header.resultCode` | `success: boolean` |
| `results.juso` | `items[]` |
| `data` (array) | `items[]` |

**Normalized Response**:
```typescript
interface NormalizedResponse<T> {
  success: boolean;
  items: T[];
  pagination?: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  raw: unknown;  // Original response for debugging
}
```

---

#### SRS-PARSE-004: Error Extraction

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-PARSE-004 |
| **Title** | 에러 정보 추출 |
| **Priority** | P0 |
| **PRD Trace** | FR-004.4 |

**Description**:
응답에서 에러 정보를 추출하고 적절한 에러 객체로 변환한다.

**Error Detection Patterns**:
```typescript
// Pattern 1: Standard response header
response.header.resultCode !== '00'

// Pattern 2: OpenAPI error response
OpenAPI_ServiceResponse.cmmMsgHeader.returnReasonCode

// Pattern 3: Business API
status_code === 'ERROR'

// Pattern 4: Address API
results.common.errorCode !== '0'
```

---

### 6.4 Cache Requirements

#### SRS-CACHE-001: Memory Cache

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-CACHE-001 |
| **Title** | 메모리 캐시 |
| **Priority** | P0 |
| **PRD Trace** | FR-007.1, US-006 |

**Description**:
인메모리 LRU 캐시를 기본 제공한다.

**Implementation**:
```typescript
class MemoryCacheAdapter implements CacheAdapter {
  private cache: Map<string, CacheEntry>;
  private maxSize: number;

  async get<T>(key: string): Promise<T | null>;
  async set<T>(key: string, value: T, ttl: number): Promise<void>;
  async delete(key: string): Promise<boolean>;
  async clear(): Promise<void>;
}
```

---

#### SRS-CACHE-002: TTL Management

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-CACHE-002 |
| **Title** | TTL 기반 만료 |
| **Priority** | P0 |
| **PRD Trace** | FR-007.2 |

**Default TTL by API**:
| API | Default TTL | Reason |
|-----|-------------|--------|
| Weather | 3600s (1h) | 시간별 갱신 |
| Business | 86400s (24h) | 거의 변하지 않음 |
| Address | 604800s (7d) | 매우 안정적 |
| Holiday | 86400s (24h) | 연 1회 갱신 |
| Transport | 30s | 실시간 데이터 |
| Air Quality | 1800s (30m) | 시간별 갱신 |
| Real Estate | 21600s (6h) | 일 1회 갱신 |

---

#### SRS-CACHE-003: Cache Key Generation

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-CACHE-003 |
| **Title** | 캐시 키 생성 |
| **Priority** | P0 |
| **PRD Trace** | FR-007.3 |

**Key Format**:
```
{adapter}:{endpoint}:{hash(params)}

Examples:
weather:getVilageFcst:a1b2c3d4
business:status:e5f6g7h8
address:search:i9j0k1l2
```

**Hash Algorithm**: SHA-256 truncated to 8 characters

---

#### SRS-CACHE-004: Redis Adapter

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-CACHE-004 |
| **Title** | Redis 캐시 어댑터 |
| **Priority** | P1 |
| **PRD Trace** | FR-007.4 |

**Description**:
ioredis를 사용한 Redis 캐시 어댑터를 제공한다 (optional peer dependency).

**Configuration**:
```typescript
const sdk = new PublicDataSDK({
  serviceKey: 'KEY',
  cache: {
    adapter: 'redis',
    redis: {
      url: 'redis://localhost:6379',
      keyPrefix: 'pdsdk:'
    }
  }
});
```

---

#### SRS-CACHE-005: Cache Invalidation

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-CACHE-005 |
| **Title** | 캐시 무효화 |
| **Priority** | P1 |
| **PRD Trace** | FR-007.5 |

**Methods**:
```typescript
// Clear specific key
await sdk.cache.delete('weather:getVilageFcst:a1b2c3d4');

// Clear all keys for an adapter
await sdk.cache.clearAdapter('weather');

// Clear all cache
await sdk.cache.clear();
```

---

### 6.5 Circuit Breaker Requirements

#### SRS-CB-001: Failure Detection

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-CB-001 |
| **Title** | 실패 감지 |
| **Priority** | P1 |
| **PRD Trace** | FR-006.1 |

**Description**:
설정된 임계값 이상 연속 실패 시 회로를 개방한다.

**Failure Conditions**:
- HTTP 5xx responses
- Network errors
- Timeout errors

**NOT Failure**:
- HTTP 4xx (client errors)
- No data (empty response)
- Validation errors

---

#### SRS-CB-002: State Transitions

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-CB-002 |
| **Title** | 상태 전이 |
| **Priority** | P1 |
| **PRD Trace** | FR-006.2 |

**State Machine**:
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│    ┌──────────┐     failures >= threshold     ┌──────────┐ │
│    │  CLOSED  │ ─────────────────────────────>│   OPEN   │ │
│    │ (Normal) │                               │ (Blocked)│ │
│    └────┬─────┘                               └────┬─────┘ │
│         ^                                          │       │
│         │                                          │       │
│         │                            resetTimeout  │       │
│         │                            elapsed       │       │
│         │                                          ▼       │
│         │      success              ┌────────────────┐    │
│         └───────────────────────────│   HALF_OPEN   │    │
│                                     │   (Testing)   │    │
│                  failure            └───────┬───────┘    │
│         ┌───────────────────────────────────┘            │
│         │                                                 │
│         ▼                                                 │
│    ┌──────────┐                                          │
│    │   OPEN   │                                          │
│    └──────────┘                                          │
│                                                           │
└─────────────────────────────────────────────────────────────┘
```

---

#### SRS-CB-003: Per-Adapter Circuit Breaker

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-CB-003 |
| **Title** | 어댑터별 독립 서킷브레이커 |
| **Priority** | P1 |
| **PRD Trace** | FR-006.3 |

**Description**:
각 어댑터는 독립적인 서킷브레이커를 가진다. Weather API 장애가 Business API에 영향을 주지 않는다.

---

#### SRS-CB-004: Circuit State Events

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-CB-004 |
| **Title** | 상태 변경 이벤트 |
| **Priority** | P2 |
| **PRD Trace** | FR-006.4 |

**Events**:
```typescript
sdk.on('circuitOpen', (adapter: string) => {
  console.log(`Circuit opened for ${adapter}`);
});

sdk.on('circuitClose', (adapter: string) => {
  console.log(`Circuit closed for ${adapter}`);
});

sdk.on('circuitHalfOpen', (adapter: string) => {
  console.log(`Circuit half-open for ${adapter}`);
});
```

---

### 6.6 Error Handling Requirements

#### SRS-ERR-001: Base Error Class

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-ERR-001 |
| **Title** | 기본 에러 클래스 |
| **Priority** | P0 |
| **PRD Trace** | FR-020.1 |

**Implementation**:
```typescript
class PublicDataError extends Error {
  readonly code: string;
  readonly retryable: boolean;
  readonly statusCode?: number;
  readonly originalError?: Error;
  readonly context?: Record<string, unknown>;

  constructor(message: string, options: ErrorOptions);

  toJSON(): ErrorJSON;
}
```

---

#### SRS-ERR-002 ~ SRS-ERR-009: Specific Error Classes

| ID | Error Class | Code | Retryable | PRD Trace |
|----|-------------|------|-----------|-----------|
| SRS-ERR-002 | `AuthenticationError` | `AUTH_ERROR` | No | FR-020.2 |
| SRS-ERR-003 | `RateLimitError` | `RATE_LIMIT` | Yes | FR-020.3 |
| SRS-ERR-004 | `ValidationError` | `VALIDATION_ERROR` | No | FR-020.4 |
| SRS-ERR-005 | `NotFoundError` | `NOT_FOUND` | No | FR-020.5 |
| SRS-ERR-006 | `ServiceUnavailableError` | `SERVICE_UNAVAILABLE` | Yes | FR-020.6 |
| SRS-ERR-007 | `NetworkError` | `NETWORK_ERROR` | Yes | FR-020.7 |
| SRS-ERR-008 | `ParseError` | `PARSE_ERROR` | No | FR-020.8 |
| SRS-ERR-009 | `CircuitOpenError` | `CIRCUIT_OPEN` | No | FR-020.9 |

---

### 6.7 Adapter Common Requirements

#### SRS-ADAPT-001: Base Adapter Interface

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-ADAPT-001 |
| **Title** | 기본 어댑터 인터페이스 |
| **Priority** | P0 |
| **PRD Trace** | FR-002.1, G1, G5 |

**Abstract Class**:
```typescript
abstract class BaseAdapter {
  abstract readonly name: string;
  abstract readonly baseUrl: string;
  abstract readonly provider: string;
  abstract readonly defaultTTL: number;

  protected httpClient: HttpClient;
  protected cache: CacheManager;
  protected circuitBreaker: CircuitBreaker;

  protected async request<T>(
    endpoint: string,
    params: Record<string, unknown>
  ): Promise<ApiResponse<T>>;

  protected async requestAll<T>(
    endpoint: string,
    params: Record<string, unknown>
  ): Promise<ApiResponse<T[]>>;
}
```

---

#### SRS-ADAPT-002: Lazy Loading

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-ADAPT-002 |
| **Title** | 어댑터 지연 로딩 |
| **Priority** | P1 |
| **PRD Trace** | FR-002.2 |

**Description**:
어댑터는 최초 접근 시에만 초기화된다.

```typescript
class PublicDataSDK {
  private _weather?: WeatherAdapter;

  get weather(): WeatherAdapter {
    if (!this._weather) {
      this._weather = new WeatherAdapter(this.config);
    }
    return this._weather;
  }
}
```

---

#### SRS-ADAPT-003: Custom Adapter Registration

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-ADAPT-003 |
| **Title** | 커스텀 어댑터 등록 |
| **Priority** | P2 |
| **PRD Trace** | FR-002.3 |

**API**:
```typescript
sdk.registerAdapter('custom', new CustomAdapter(config));
sdk.custom.someMethod(params);
```

---

### 6.8 Weather Adapter Requirements

#### SRS-WTH-001: Short-term Forecast

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-WTH-001 |
| **Title** | 단기예보 조회 |
| **Priority** | P0 |
| **PRD Trace** | FR-010.1, US-002 |

**Method**: `getForecast(params: ForecastParams): Promise<ApiResponse<ForecastItem[]>>`

**Parameters**:
```typescript
interface ForecastParams {
  baseDate: string;    // YYYYMMDD
  baseTime: string;    // HHMM (0200, 0500, 0800, ...)
  nx: number;          // Grid X coordinate
  ny: number;          // Grid Y coordinate
  pageNo?: number;
  numOfRows?: number;
}
```

**Response**:
```typescript
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

#### SRS-WTH-002: Ultra Short-term Observation

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-WTH-002 |
| **Title** | 초단기실황 조회 |
| **Priority** | P0 |
| **PRD Trace** | FR-010.2 |

**Method**: `getCurrentConditions(params: CurrentParams): Promise<ApiResponse<CurrentWeather>>`

---

#### SRS-WTH-003: Ultra Short-term Forecast

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-WTH-003 |
| **Title** | 초단기예보 조회 |
| **Priority** | P1 |
| **PRD Trace** | FR-010.3 |

**Method**: `getUltraShortForecast(params: UltraShortParams): Promise<ApiResponse<ForecastItem[]>>`

---

#### SRS-WTH-004: Coordinate Conversion

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-WTH-004 |
| **Title** | 좌표 변환 |
| **Priority** | P1 |
| **PRD Trace** | FR-010.4 |

**Method**: `convertCoordinates(lat: number, lng: number): { nx: number; ny: number }`

**Algorithm**: Lambert Conformal Conic Projection

**Parameters**:
```
- Earth radius: 6371.00877 km
- Grid spacing: 5.0 km
- Reference point: 38.0°N, 126.0°E → (43, 136)
- Standard parallels: 30.0°N, 60.0°N
```

---

#### SRS-WTH-005: Category Code Translation

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-WTH-005 |
| **Title** | 카테고리 코드 변환 |
| **Priority** | P1 |
| **PRD Trace** | FR-010.5 |

**Translation Table**:
| Code | Name | Description |
|------|------|-------------|
| `TMP` | temperature | 기온 (℃) |
| `POP` | precipitationProbability | 강수확률 (%) |
| `PTY` | precipitationType | 강수형태 |
| `SKY` | skyCondition | 하늘상태 |
| `REH` | humidity | 습도 (%) |
| `WSD` | windSpeed | 풍속 (m/s) |

---

### 6.9 Business Adapter Requirements

#### SRS-BIZ-001: Single Status Check

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-BIZ-001 |
| **Title** | 단건 상태 조회 |
| **Priority** | P0 |
| **PRD Trace** | FR-011.1, US-003 |

**Method**: `getStatus(params: StatusParams): Promise<ApiResponse<BusinessStatus>>`

**Parameters**:
```typescript
interface StatusParams {
  businessNumber: string;  // 10 digits, no hyphens
}
```

**Response**:
```typescript
interface BusinessStatus {
  businessNumber: string;
  status: {
    code: '01' | '02' | '03';
    description: string;  // 계속사업자, 휴업자, 폐업자
  };
  taxType: {
    code: string;
    description: string;
  };
  closedDate?: string;
}
```

---

#### SRS-BIZ-002: Batch Status Check

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-BIZ-002 |
| **Title** | 다건 상태 조회 |
| **Priority** | P0 |
| **PRD Trace** | FR-011.2 |

**Method**: `getStatusBatch(params: StatusBatchParams): Promise<ApiResponse<BusinessStatus[]>>`

**Constraint**: Maximum 100 business numbers per request

---

#### SRS-BIZ-003: Verification

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-BIZ-003 |
| **Title** | 진위확인 |
| **Priority** | P0 |
| **PRD Trace** | FR-011.3 |

**Method**: `verify(params: VerifyParams): Promise<ApiResponse<VerifyResult>>`

**Parameters**:
```typescript
interface VerifyParams {
  businessNumber: string;
  startDate: string;         // YYYYMMDD
  representativeName: string;
  companyName?: string;
}
```

---

#### SRS-BIZ-004: Business Number Validation

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-BIZ-004 |
| **Title** | 사업자번호 형식 검증 |
| **Priority** | P1 |
| **PRD Trace** | FR-011.4 |

**Validation Rules**:
1. 10 digits only
2. Remove hyphens if present
3. Check format: XXX-XX-XXXXX

---

#### SRS-BIZ-005: Checksum Validation

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-BIZ-005 |
| **Title** | 체크섬 사전 검증 |
| **Priority** | P2 |
| **PRD Trace** | FR-011.5 |

**Algorithm**:
```typescript
function validateChecksum(bizNo: string): boolean {
  const weights = [1, 3, 7, 1, 3, 7, 1, 3, 5];
  let sum = 0;

  for (let i = 0; i < 9; i++) {
    sum += parseInt(bizNo[i]) * weights[i];
  }
  sum += Math.floor((parseInt(bizNo[8]) * 5) / 10);

  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(bizNo[9]);
}
```

---

### 6.10 Address Adapter Requirements

#### SRS-ADDR-001: Address Search

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-ADDR-001 |
| **Title** | 도로명주소 검색 |
| **Priority** | P0 |
| **PRD Trace** | FR-012.1, US-004 |

**Method**: `search(params: SearchParams): Promise<ApiResponse<AddressResult[]>>`

---

#### SRS-ADDR-002: Coordinate Search

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-ADDR-002 |
| **Title** | 좌표 검색 |
| **Priority** | P1 |
| **PRD Trace** | FR-012.2 |

**Method**: `getCoordinates(params: CoordParams): Promise<ApiResponse<Coordinates>>`

---

#### SRS-ADDR-003: English Address Search

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-ADDR-003 |
| **Title** | 영문주소 검색 |
| **Priority** | P2 |
| **PRD Trace** | FR-012.3 |

---

#### SRS-ADDR-004: Zip Code Lookup

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-ADDR-004 |
| **Title** | 우편번호 조회 |
| **Priority** | P1 |
| **PRD Trace** | FR-012.4 |

**Method**: `getZipCode(address: string): Promise<string>`

---

### 6.11 Holiday Adapter Requirements

#### SRS-HLDY-001: Public Holidays

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-HLDY-001 |
| **Title** | 공휴일 조회 |
| **Priority** | P1 |
| **PRD Trace** | FR-013.1, US-007 |

---

#### SRS-HLDY-002: National Holidays

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-HLDY-002 |
| **Title** | 국경일 조회 |
| **Priority** | P1 |
| **PRD Trace** | FR-013.2 |

---

#### SRS-HLDY-003: 24 Divisions

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-HLDY-003 |
| **Title** | 24절기 조회 |
| **Priority** | P2 |
| **PRD Trace** | FR-013.3 |

---

#### SRS-HLDY-004: Is Holiday Check

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-HLDY-004 |
| **Title** | 공휴일 여부 확인 |
| **Priority** | P1 |
| **PRD Trace** | FR-013.4 |

**Method**: `isHoliday(date: string | Date): Promise<boolean>`

---

### 6.12 Transport Adapter Requirements

#### SRS-TRNS-001: Bus Arrival Info

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-TRNS-001 |
| **Title** | 버스 도착 정보 |
| **Priority** | P1 |
| **PRD Trace** | FR-014.1, US-008 |

---

#### SRS-TRNS-002: Bus Station Search

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-TRNS-002 |
| **Title** | 버스 정류소 검색 |
| **Priority** | P1 |
| **PRD Trace** | FR-014.2 |

---

#### SRS-TRNS-003: Bus Route Info

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-TRNS-003 |
| **Title** | 버스 노선 정보 |
| **Priority** | P2 |
| **PRD Trace** | FR-014.3 |

---

#### SRS-TRNS-004: Subway Station Search

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-TRNS-004 |
| **Title** | 지하철역 검색 |
| **Priority** | P2 |
| **PRD Trace** | FR-014.4 |

---

### 6.13 Air Quality Adapter Requirements

#### SRS-AIR-001: Station Realtime Data

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-AIR-001 |
| **Title** | 측정소별 실시간 측정 |
| **Priority** | P1 |
| **PRD Trace** | FR-015.1, US-009 |

---

#### SRS-AIR-002: Sido Realtime Data

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-AIR-002 |
| **Title** | 시도별 실시간 측정 |
| **Priority** | P1 |
| **PRD Trace** | FR-015.2 |

---

#### SRS-AIR-003: Nearby Stations

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-AIR-003 |
| **Title** | 근접 측정소 조회 |
| **Priority** | P2 |
| **PRD Trace** | FR-015.3 |

---

#### SRS-AIR-004: CAI Grade Interpretation

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-AIR-004 |
| **Title** | CAI 등급 해석 |
| **Priority** | P1 |
| **PRD Trace** | FR-015.4 |

**Translation**:
| Grade | Korean | English | Color |
|-------|--------|---------|-------|
| 1 | 좋음 | Good | Blue |
| 2 | 보통 | Moderate | Green |
| 3 | 나쁨 | Unhealthy | Yellow |
| 4 | 매우나쁨 | Very Unhealthy | Red |

---

### 6.14 Real Estate Adapter Requirements

#### SRS-RE-001: Apartment Trade

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-RE-001 |
| **Title** | 아파트 매매 실거래 |
| **Priority** | P1 |
| **PRD Trace** | FR-016.1, US-010 |

---

#### SRS-RE-002: Apartment Rental

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-RE-002 |
| **Title** | 아파트 전월세 실거래 |
| **Priority** | P1 |
| **PRD Trace** | FR-016.2 |

---

#### SRS-RE-003: Officetel Trade

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-RE-003 |
| **Title** | 오피스텔 실거래 |
| **Priority** | P2 |
| **PRD Trace** | FR-016.3 |

---

#### SRS-RE-004: Price Parsing

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-RE-004 |
| **Title** | 금액 파싱 및 포맷팅 |
| **Priority** | P1 |
| **PRD Trace** | FR-016.4 |

**Functions**:
```typescript
// Parse "180,000" → 180000
function parsePrice(priceStr: string): number;

// Format 180000 → "18억"
function formatPrice(price: number): string;

// Convert ㎡ → 평
function sqmToPyeong(sqm: number): number;
```

---

## 7. Non-Functional Requirements

### 7.1 Performance Requirements

#### SRS-PERF-001: API Response Time

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-PERF-001 |
| **Title** | API 응답 시간 |
| **Priority** | P0 |
| **PRD Trace** | NFR-001, NFR-002 |

**Specifications**:
| Scenario | Target (P95) | Max |
|----------|--------------|-----|
| Cache Miss | < 3,000ms | 30,000ms |
| Cache Hit | < 10ms | 100ms |
| SDK Init | < 100ms | 500ms |

---

#### SRS-PERF-002: Memory Usage

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-PERF-002 |
| **Title** | 메모리 사용량 |
| **Priority** | P1 |
| **PRD Trace** | NFR-004 |

**Specifications**:
| State | Max Memory |
|-------|------------|
| Idle | < 50MB |
| Active (1000 cached items) | < 100MB |
| Peak | < 200MB |

---

#### SRS-PERF-003: Concurrent Requests

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-PERF-003 |
| **Title** | 동시 요청 처리 |
| **Priority** | P1 |
| **PRD Trace** | NFR-005 |

**Specification**: > 100 requests/second

---

### 7.2 Security Requirements

#### SRS-SEC-001: Service Key Masking

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-SEC-001 |
| **Title** | 서비스 키 마스킹 |
| **Priority** | P0 |
| **PRD Trace** | NFR-030 |

**Implementation**:
```typescript
function maskServiceKey(key: string): string {
  if (key.length <= 8) return '****';
  return key.substring(0, 4) + '****' + key.substring(key.length - 4);
}

// In logs: "Using service key: AbCd****xYzW"
```

---

#### SRS-SEC-002: HTTPS Enforcement

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-SEC-002 |
| **Title** | HTTPS 강제 |
| **Priority** | P0 |
| **PRD Trace** | NFR-033 |

**Implementation**:
- All API calls must use HTTPS
- HTTP URLs automatically upgraded to HTTPS
- TLS 1.2+ required

---

#### SRS-SEC-003: Input Validation

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-SEC-003 |
| **Title** | 입력 검증 |
| **Priority** | P0 |
| **PRD Trace** | NFR-032 |

**Validation**:
- Sanitize all user inputs before API calls
- Validate parameter types and ranges
- Prevent injection attacks (SQL, XSS in returned data)

---

#### SRS-SEC-004: Dependency Security

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-SEC-004 |
| **Title** | 의존성 보안 |
| **Priority** | P0 |
| **PRD Trace** | NFR-031 |

**Requirements**:
- Zero high/critical vulnerabilities in dependencies
- Regular npm audit in CI/CD
- Dependabot enabled for security updates

---

### 7.3 Compatibility Requirements

#### SRS-COMPAT-001: Node.js Versions

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-COMPAT-001 |
| **Title** | Node.js 버전 지원 |
| **Priority** | P0 |
| **PRD Trace** | NFR-050 |

**Supported Versions**:
- Node.js 18.x (LTS)
- Node.js 20.x (LTS)
- Node.js 22.x (Current)

---

#### SRS-COMPAT-002: Module Systems

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-COMPAT-002 |
| **Title** | 모듈 시스템 지원 |
| **Priority** | P0 |
| **PRD Trace** | NFR-052 |

**Dual Package Support**:
```json
{
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  }
}
```

---

#### SRS-COMPAT-003: TypeScript Version

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-COMPAT-003 |
| **Title** | TypeScript 버전 지원 |
| **Priority** | P0 |
| **PRD Trace** | NFR-051 |

**Minimum Version**: TypeScript 5.0+

---

#### SRS-COMPAT-004: Bundle Size

| Attribute | Value |
|-----------|-------|
| **ID** | SRS-COMPAT-004 |
| **Title** | 번들 크기 |
| **Priority** | P1 |
| **PRD Trace** | NFR-053 |

**Specification**: < 100KB (minified, excluding peer dependencies)

---

## 8. Data Requirements

### 8.1 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Data Flow                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  User App                                                               │
│     │                                                                   │
│     │ (1) API Call with params                                          │
│     ▼                                                                   │
│  ┌─────────────────┐                                                    │
│  │   SDK Public    │                                                    │
│  │      API        │                                                    │
│  └────────┬────────┘                                                    │
│           │                                                             │
│           │ (2) Check cache                                             │
│           ▼                                                             │
│  ┌─────────────────┐     Cache Hit      ┌─────────────────┐            │
│  │  Cache Manager  │ ──────────────────>│  Return cached  │            │
│  └────────┬────────┘                    │     response    │            │
│           │                              └─────────────────┘            │
│           │ Cache Miss                                                  │
│           ▼                                                             │
│  ┌─────────────────┐                                                    │
│  │ Circuit Breaker │ ─── Open ──> Throw CircuitOpenError               │
│  └────────┬────────┘                                                    │
│           │ Closed/Half-Open                                            │
│           ▼                                                             │
│  ┌─────────────────┐                                                    │
│  │   HTTP Client   │                                                    │
│  │   (with retry)  │                                                    │
│  └────────┬────────┘                                                    │
│           │ (3) HTTP Request                                            │
│           ▼                                                             │
│  ┌─────────────────┐                                                    │
│  │  External API   │                                                    │
│  └────────┬────────┘                                                    │
│           │ (4) HTTP Response (JSON/XML)                                │
│           ▼                                                             │
│  ┌─────────────────┐                                                    │
│  │     Parser      │                                                    │
│  │  (Normalize)    │                                                    │
│  └────────┬────────┘                                                    │
│           │ (5) Normalized response                                     │
│           ▼                                                             │
│  ┌─────────────────┐                                                    │
│  │  Store in Cache │                                                    │
│  └────────┬────────┘                                                    │
│           │ (6) Return to user                                          │
│           ▼                                                             │
│     User App                                                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Data Dictionary

#### Configuration Data

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `serviceKey` | string | Yes | Public data portal service key |
| `accountType` | enum | No | 'development' \| 'production' |
| `dataType` | enum | No | 'JSON' \| 'XML' |

#### Cache Entry Data

| Field | Type | Description |
|-------|------|-------------|
| `key` | string | Cache key (adapter:endpoint:hash) |
| `value` | unknown | Cached response data |
| `ttl` | number | Time to live (seconds) |
| `createdAt` | number | Timestamp (ms) |
| `expiresAt` | number | Expiration timestamp (ms) |

#### API Response Data

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the request succeeded |
| `items` | T[] | Response data array |
| `pagination` | object | Pagination info (if applicable) |
| `meta` | object | Response metadata |
| `raw` | unknown | Original raw response |

---

## 9. Use Case Specifications

### 9.1 UC-001: Initialize SDK

| Attribute | Value |
|-----------|-------|
| **ID** | UC-001 |
| **Name** | SDK 초기화 |
| **Actor** | Developer |
| **PRD Trace** | US-001 |

**Preconditions**:
- Node.js 18+ installed
- npm package installed
- Valid service key available

**Main Flow**:
1. Developer imports SDK
2. Developer creates SDK instance with config
3. SDK validates configuration
4. SDK initializes core modules
5. SDK returns instance

**Alternate Flows**:
- 2a. No serviceKey provided → Load from environment
- 3a. Invalid config → Throw ValidationError

**Postconditions**:
- SDK instance ready for use
- All adapters accessible

---

### 9.2 UC-002: Get Weather Forecast

| Attribute | Value |
|-----------|-------|
| **ID** | UC-002 |
| **Name** | 날씨 예보 조회 |
| **Actor** | Developer |
| **PRD Trace** | US-002 |

**Preconditions**:
- SDK initialized
- Valid coordinates available

**Main Flow**:
1. Developer calls `sdk.weather.getForecast(params)`
2. SDK checks cache
3. (Cache miss) SDK makes HTTP request
4. SDK parses response
5. SDK caches response
6. SDK returns forecast data

**Alternate Flows**:
- 2a. Cache hit → Return cached data (skip 3-5)
- 3a. Circuit open → Throw CircuitOpenError
- 3b. Request fails → Retry with backoff
- 4a. Parse error → Throw ParseError

**Postconditions**:
- Forecast data returned
- Data cached for future requests

---

### 9.3 UC-003: Verify Business Registration

| Attribute | Value |
|-----------|-------|
| **ID** | UC-003 |
| **Name** | 사업자등록 진위확인 |
| **Actor** | Developer |
| **PRD Trace** | US-003 |

**Main Flow**:
1. Developer calls `sdk.business.verify(params)`
2. SDK validates business number format
3. (Optional) SDK validates checksum
4. SDK makes POST request
5. SDK parses response
6. SDK returns verification result

---

### 9.4 UC-004: Search Address

| Attribute | Value |
|-----------|-------|
| **ID** | UC-004 |
| **Name** | 주소 검색 |
| **Actor** | Developer |
| **PRD Trace** | US-004 |

**Main Flow**:
1. Developer calls `sdk.address.search(params)`
2. SDK makes HTTP request to juso.go.kr
3. SDK parses response
4. SDK normalizes address data
5. SDK returns address results

---

### 9.5 UC-005: Handle API Error

| Attribute | Value |
|-----------|-------|
| **ID** | UC-005 |
| **Name** | API 에러 처리 |
| **Actor** | Developer |
| **PRD Trace** | US-005 |

**Main Flow**:
1. Developer makes API call
2. API returns error response
3. SDK parses error
4. SDK throws appropriate error type
5. Developer catches and handles error

**Error Type Mapping**:
| API Error Code | SDK Error Type |
|----------------|----------------|
| 22, 30, 31 | AuthenticationError |
| 21 | RateLimitError |
| 10, 11 | ValidationError |
| 03 | NotFoundError |
| 01, 02, 04, 05 | ServiceUnavailableError |

---

## 10. Appendix

### A. Requirement Status Summary

| Category | Total | P0 | P1 | P2 |
|----------|-------|----|----|----|
| Core | 5 | 4 | 1 | 0 |
| HTTP | 5 | 5 | 0 | 0 |
| Parser | 4 | 4 | 0 | 0 |
| Cache | 5 | 3 | 2 | 0 |
| Circuit Breaker | 4 | 0 | 3 | 1 |
| Error Handling | 9 | 8 | 1 | 0 |
| Adapter Common | 3 | 1 | 1 | 1 |
| Weather | 5 | 2 | 3 | 0 |
| Business | 5 | 3 | 1 | 1 |
| Address | 4 | 1 | 2 | 1 |
| Holiday | 4 | 0 | 3 | 1 |
| Transport | 4 | 0 | 2 | 2 |
| Air Quality | 4 | 0 | 3 | 1 |
| Real Estate | 4 | 0 | 3 | 1 |
| Performance | 3 | 1 | 2 | 0 |
| Security | 4 | 4 | 0 | 0 |
| Compatibility | 4 | 3 | 1 | 0 |
| **Total** | **76** | **39** | **28** | **9** |

### B. Open Issues

| ID | Issue | Status | Resolution |
|----|-------|--------|------------|
| OI-001 | Address API 별도 승인키 처리 방안 | Open | TBD |
| OI-002 | Redis adapter 테스트 환경 구축 | Open | TBD |
| OI-003 | 브라우저 환경 지원 범위 | Resolved | Out of Scope |

### C. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-02-05 | SDK Team | Initial SRS |

---

## Document Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Author | | | |
| Reviewer | | | |
| Approver | | | |
