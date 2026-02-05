# Korea Government Public APIs Reference

A comprehensive list of public APIs provided by the Korean government and public institutions.

> **Last Updated**: 2026-02-05
> **Portal**: [공공데이터포털 (data.go.kr)](https://www.data.go.kr/)

---

## Table of Contents

1. [Overview](#overview)
2. [Central Data Portals](#central-data-portals)
3. [Weather & Environment](#weather--environment)
4. [Transportation](#transportation)
5. [Real Estate & Housing](#real-estate--housing)
6. [Business & Finance](#business--finance)
7. [Address & Location](#address--location)
8. [Healthcare & Welfare](#healthcare--welfare)
9. [Culture & Tourism](#culture--tourism)
10. [Statistics & Research](#statistics--research)
11. [Legal & Administrative](#legal--administrative)
12. [Map & Geospatial](#map--geospatial)
13. [API Usage Guide](#api-usage-guide)

---

## Overview

The Korean government provides extensive public data through various Open APIs, primarily managed through the **공공데이터포털 (Public Data Portal)**. These APIs cover diverse domains including weather, transportation, real estate, healthcare, and more.

### Key Characteristics

- **Authentication**: Most APIs require API key registration via data.go.kr
- **Rate Limits**: Typically 1,000-10,000 calls/day (varies by API)
- **Formats**: XML and JSON responses
- **Protocol**: REST API (HTTP/HTTPS)

---

## Central Data Portals

### 공공데이터포털 (Public Data Portal)

| Item | Description |
|------|-------------|
| **URL** | https://www.data.go.kr/ |
| **Provider** | 행정안전부 (Ministry of the Interior and Safety) |
| **Description** | Central hub for all Korean government open data and APIs |
| **Data Volume** | 100,000+ datasets |
| **API Types** | File data, Open API, Standard data |

### 정부24 Open API

| Item | Description |
|------|-------------|
| **URL** | https://www.gov.kr/openapi |
| **Provider** | 행정안전부 |
| **Description** | Government civil service information APIs |
| **Key APIs** | 민원서비스 정보, 보조금24, 정부 통계연보 |

---

## Weather & Environment

### 기상청 단기예보 조회서비스

| Item | Description |
|------|-------------|
| **Portal URL** | https://www.data.go.kr/data/15084084/openapi.do |
| **Provider** | 기상청 (Korea Meteorological Administration) |
| **Description** | Short-term weather forecast for Korea (5km grid) |
| **Data** | 초단기실황, 초단기예보, 단기예보 |
| **Update Frequency** | Every hour |

### 기상청 API 허브

| Item | Description |
|------|-------------|
| **URL** | https://apihub.kma.go.kr/ |
| **Provider** | 기상청 |
| **Description** | Comprehensive weather data platform |
| **Categories** | 관측, 예보, 위성, 레이더 등 12개 분야 |

### 기상자료개방포털

| Item | Description |
|------|-------------|
| **URL** | https://data.kma.go.kr/ |
| **Provider** | 기상청 |
| **Description** | Historical weather data and statistics |
| **Data** | 기상관측자료, 기후통계자료, 특수관측자료 |

### 한국환경공단 대기오염정보

| Item | Description |
|------|-------------|
| **Portal URL** | https://www.data.go.kr/data/15073861/openapi.do |
| **Provider** | 한국환경공단 |
| **Description** | Real-time air quality data |
| **Data** | 미세먼지(PM10, PM2.5), 오존, 이산화질소 등 |

---

## Transportation

### 서울특별시 버스도착정보조회 서비스

| Item | Description |
|------|-------------|
| **Portal URL** | https://www.data.go.kr/data/15000314/openapi.do |
| **Provider** | 서울특별시 |
| **Description** | Real-time bus arrival information in Seoul |
| **Data** | 버스도착예정시간, 차량번호, 혼잡도 |

### 서울 TOPIS 교통정보

| Item | Description |
|------|-------------|
| **URL** | https://topis.seoul.go.kr/ |
| **Provider** | 서울특별시 |
| **Description** | Comprehensive Seoul traffic information |
| **Data** | 실시간 교통상황, CCTV, 돌발상황 |

### 국토교통부 대중교통정보

| Item | Description |
|------|-------------|
| **Provider** | 국토교통부 |
| **Description** | National public transportation data |
| **Data** | 버스노선, 정류장정보, 운행시간 |

### 한국철도공사 열차정보

| Item | Description |
|------|-------------|
| **Provider** | 한국철도공사 (KORAIL) |
| **Description** | Train schedule and station information |
| **Data** | 열차시간표, 역정보, 운임정보 |

### ODsay 대중교통 API

| Item | Description |
|------|-------------|
| **URL** | https://lab.odsay.com/ |
| **Provider** | ODsay Lab |
| **Description** | Integrated public transportation routing |
| **Data** | 전국 대중교통, 고속버스, 항공편 |

---

## Real Estate & Housing

### 국토교통부 아파트매매 실거래가

| Item | Description |
|------|-------------|
| **Portal URL** | https://www.data.go.kr/data/15057511/openapi.do |
| **Provider** | 국토교통부 |
| **Description** | Apartment sales transaction prices |
| **Data** | 거래금액, 거래일자, 층, 전용면적 |

### 국토교통부 아파트 전월세 실거래가

| Item | Description |
|------|-------------|
| **Provider** | 국토교통부 |
| **Description** | Apartment rental (jeonse/monthly) prices |
| **Data** | 보증금, 월세, 계약면적, 계약기간 |

### 국토교통부 오피스텔 실거래가

| Item | Description |
|------|-------------|
| **Provider** | 국토교통부 |
| **Description** | Officetel transaction and rental prices |
| **Data** | 매매가, 전월세가, 면적정보 |

### 국토교통부 단독/다가구 실거래가

| Item | Description |
|------|-------------|
| **Provider** | 국토교통부 |
| **Description** | Single/multi-family house transaction prices |

### 건축물대장 정보

| Item | Description |
|------|-------------|
| **Provider** | 국토교통부 |
| **Description** | Building registry information |
| **Data** | 건물용도, 연면적, 층수, 준공일자 |

---

## Business & Finance

### 국세청 사업자등록정보 진위확인

| Item | Description |
|------|-------------|
| **Portal URL** | https://www.data.go.kr/data/15081808/openapi.do |
| **Provider** | 국세청 (National Tax Service) |
| **Description** | Business registration verification |
| **Data** | 사업자등록상태, 휴/폐업여부, 과세유형 |
| **Rate Limit** | 100 records/call, 1M calls/day |

### 금융위원회 기업기본정보

| Item | Description |
|------|-------------|
| **Portal URL** | https://www.data.go.kr/data/15043184/openapi.do |
| **Provider** | 금융위원회 |
| **Description** | Basic corporate information |
| **Data** | 기업명, 대표자, 설립일, 업종, 종업원수 |

### 한국은행 경제통계 (ECOS)

| Item | Description |
|------|-------------|
| **URL** | https://ecos.bok.or.kr/api/ |
| **Provider** | 한국은행 (Bank of Korea) |
| **Description** | Economic statistics database |
| **Data** | 금리, 환율, 물가, 통화량 등 |

### 금융결제원 오픈뱅킹

| Item | Description |
|------|-------------|
| **URL** | https://openapi.kftc.or.kr/ |
| **Provider** | 금융결제원 |
| **Description** | Integrated banking services |
| **Data** | 계좌조회, 이체, 결제 (19개+ 은행 연동) |

### 조달청 나라장터 공공데이터

| Item | Description |
|------|-------------|
| **Portal URL** | https://www.data.go.kr/data/15058815/openapi.do |
| **Provider** | 조달청 |
| **Description** | Government procurement information |
| **Data** | 입찰공고, 계약정보, 낙찰정보 |

---

## Address & Location

### 도로명주소 조회서비스

| Item | Description |
|------|-------------|
| **Portal URL** | https://www.data.go.kr/data/15000124/openapi.do |
| **URL** | https://www.juso.go.kr/ |
| **Provider** | 행정안전부 / 우정사업본부 |
| **Description** | Road name address lookup |
| **Data** | 도로명주소, 지번주소, 우편번호, 좌표 |

### 우정사업본부 우편번호 조회

| Item | Description |
|------|-------------|
| **Provider** | 과학기술정보통신부 우정사업본부 |
| **Description** | Postal code lookup (2015 new format) |
| **Data** | 우편번호, 주소, 영문주소 |

### 행정구역코드 조회

| Item | Description |
|------|-------------|
| **Provider** | 행정안전부 |
| **Description** | Administrative district codes |
| **Data** | 시도코드, 시군구코드, 읍면동코드 |

---

## Healthcare & Welfare

### 보건의료데이터개방시스템

| Item | Description |
|------|-------------|
| **URL** | https://opendata.hira.or.kr/ |
| **Provider** | 건강보험심사평가원 |
| **Description** | Healthcare data platform |
| **Data** | 의료기관정보, 진료통계, 의약품정보 |

### 국민건강보험공단 검진기관 정보

| Item | Description |
|------|-------------|
| **Portal URL** | https://www.data.go.kr/data/15001672/openapi.do |
| **Provider** | 국민건강보험공단 |
| **Description** | Health screening facility information |
| **Data** | 검진기관 위치, 운영시간, 검진항목 |

### 식품의약품안전처 의약품 정보

| Item | Description |
|------|-------------|
| **Provider** | 식품의약품안전처 |
| **Description** | Medicine and pharmaceutical data |
| **Data** | 의약품 성분, 효능, 부작용 정보 |

### 복지로 복지서비스 정보

| Item | Description |
|------|-------------|
| **URL** | https://www.bokjiro.go.kr/ |
| **Provider** | 보건복지부 |
| **Description** | Social welfare service information |
| **Data** | 복지급여, 서비스대상, 신청방법 |

---

## Culture & Tourism

### 한국관광공사 TourAPI

| Item | Description |
|------|-------------|
| **URL** | https://api.visitkorea.or.kr/ |
| **Provider** | 한국관광공사 |
| **Description** | Comprehensive tourism information |
| **Data** | 관광지, 숙박, 음식점, 축제, 코스 |

### 문화재청 국가문화유산포털

| Item | Description |
|------|-------------|
| **Provider** | 문화재청 |
| **Description** | National heritage information |
| **Data** | 문화재 정보, 위치, 역사적 배경 |

### 국립중앙도서관 서지정보

| Item | Description |
|------|-------------|
| **Provider** | 국립중앙도서관 |
| **Description** | Bibliographic information |
| **Data** | 도서정보, ISBN, 저자, 출판사 |

### 영화진흥위원회 영화정보

| Item | Description |
|------|-------------|
| **Provider** | 영화진흥위원회 |
| **Description** | Movie information database |
| **Data** | 영화정보, 박스오피스, 상영관 |

---

## Statistics & Research

### 통계청 KOSIS

| Item | Description |
|------|-------------|
| **URL** | https://kosis.kr/ |
| **Provider** | 통계청 (Statistics Korea) |
| **Description** | National statistics portal |
| **Data** | 134,586종 국가승인통계 |

### 한국천문연구원 특일정보

| Item | Description |
|------|-------------|
| **Portal URL** | https://www.data.go.kr/data/15012690/openapi.do |
| **Provider** | 한국천문연구원 |
| **Description** | Special day information (holidays) |
| **Data** | 국경일, 공휴일, 기념일, 24절기 |

### e-나라지표

| Item | Description |
|------|-------------|
| **URL** | https://www.index.go.kr/ |
| **Provider** | 기획재정부 |
| **Description** | National indicator statistics |
| **Data** | 국가주요지표, 정책지표 |

---

## Legal & Administrative

### 국가법령정보 Open API

| Item | Description |
|------|-------------|
| **URL** | https://open.law.go.kr/ |
| **Provider** | 법제처 |
| **Description** | National law and regulation information |
| **Data** | 법령, 행정규칙, 자치법규, 판례 |

### 대한민국영문법령

| Item | Description |
|------|-------------|
| **URL** | https://openlaw.klri.re.kr/ |
| **Provider** | 한국법제연구원 |
| **Description** | Korean laws in English |

### 국가기록원 기록물 정보

| Item | Description |
|------|-------------|
| **URL** | https://www.archives.go.kr/ |
| **Provider** | 국가기록원 |
| **Description** | National archive records |
| **Data** | 토지대장, 임야대장, 지적기록물 |

### 대법원 판례정보

| Item | Description |
|------|-------------|
| **Provider** | 대법원 |
| **Description** | Court case information |
| **Data** | 판례, 결정문, 법원공고 |

---

## Map & Geospatial

### 브이월드 (VWorld)

| Item | Description |
|------|-------------|
| **URL** | https://www.vworld.kr/ |
| **Provider** | 국토지리정보원 |
| **Description** | 3D map and spatial data platform |
| **Data** | 지도API, 수치지도, 항공영상, 3D 모델 |

### 국가공간정보포털

| Item | Description |
|------|-------------|
| **URL** | https://www.nsdi.go.kr/ |
| **Provider** | 국토교통부 |
| **Description** | National spatial data infrastructure |
| **Data** | 지적도, 용도지역, 개별공시지가 |

---

## API Usage Guide

### Registration Process

1. **회원가입**: Visit [data.go.kr](https://www.data.go.kr/) and create an account
2. **API 검색**: Search for the desired API
3. **활용신청**: Apply for API usage (approval may take 1-3 days)
4. **인증키 발급**: Receive API key after approval
5. **개발 및 테스트**: Implement and test your application

### Common Request Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `serviceKey` | Encoded API key | `YOUR_API_KEY` |
| `pageNo` | Page number | `1` |
| `numOfRows` | Results per page | `10` |
| `dataType` | Response format | `JSON` or `XML` |

### Sample API Call

```bash
curl "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=YOUR_API_KEY&pageNo=1&numOfRows=10&dataType=JSON&base_date=20260205&base_time=0500&nx=55&ny=127"
```

### Rate Limits

| Category | Typical Limit |
|----------|---------------|
| Daily calls | 1,000 - 1,000,000 |
| Calls per minute | 60 - 600 |
| Results per page | 1 - 1,000 |

### Error Codes

| Code | Description |
|------|-------------|
| `00` | Success |
| `01` | Application error |
| `02` | DB error |
| `03` | No data |
| `04` | HTTP error |
| `05` | Service timeout |
| `10` | Invalid request parameter |
| `11` | No required parameter |
| `12` | No OpenAPI service |
| `20` | Service access denied |
| `21` | Service request limit exceeded |
| `22` | Unregistered service key |
| `30` | Service key expiration |
| `31` | Unregistered IP |

---

## Additional Resources

### Official Portals

- [공공데이터포털](https://www.data.go.kr/) - Main data portal
- [정부24](https://www.gov.kr/) - Government services
- [국가공간정보포털](https://www.nsdi.go.kr/) - Spatial data
- [보건의료데이터개방시스템](https://opendata.hira.or.kr/) - Healthcare data

### Community Resources

- [GitHub: public-apis-4Kr](https://github.com/yybmion/public-apis-4Kr) - Korean public API collection

### Support

- **공공데이터활용지원센터**: 1566-0025
- **Email**: support@data.go.kr

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-05 | Initial document creation |

---

*This document is maintained as part of the public_api project documentation.*
