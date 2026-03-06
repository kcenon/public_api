# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0-beta.1] - 2026-03-06

### Added

- **Core SDK**: `PublicDataSDK` class with lazy adapter initialization and shared context
- **7 API Adapters**:
  - Weather (기상청) — short-term forecasts, ultra short-term observations
  - Business (국세청) — registration status check, business validation
  - Address (행정안전부/juso.go.kr) — road name address search, coordinate lookup, English address
  - Holiday (한국천문연구원) — public holidays, national days, solar terms
  - Transport (국토교통부) — real-time bus arrivals, stop search, route info
  - Air Quality (한국환경공단) — station/region air quality, nearby station search
  - Real Estate (국토교통부) — apartment sales/rentals, office sales, price utilities
- **HTTP Client**: Built-in retry with exponential backoff, configurable timeout
- **Caching**: In-memory LRU cache with per-adapter TTLs, optional Redis adapter
- **Circuit Breaker**: Automatic failure detection with CLOSED/OPEN/HALF_OPEN states
- **Response Parser**: Auto-detection of JSON/XML formats, data.go.kr normalization
- **Error Hierarchy**: 8 typed error classes (Authentication, RateLimit, Validation, Network, etc.)
- **TypeScript**: Full type safety with exported types for all parameters and responses
- **Dual Package**: ESM and CJS output via tsup
- **CI/CD**: GitHub Actions for lint, test (Node 18/20/22), security audit, build verification
- **Release Pipeline**: Tag-based npm publishing with provenance and GitHub Release creation
- **Documentation**: README, SDK reference, error types, cache guide, quickstart tutorial
- **Test Infrastructure**: 328 tests, 98%+ coverage, fixture-based testing with integration suites

### Known Limitations

- No sandbox/test environment for Korean public APIs — all tests use fixtures
- Redis cache adapter requires separate `ioredis` installation (optional peer dependency)
- Address adapter uses a separate service key from juso.go.kr (not data.go.kr)
