# Essential Guidelines for Korean Public API Usage

Critical information that developers MUST know before using Korean government public APIs.

> **Last Updated**: 2026-02-05
> **Importance**: HIGH - Non-compliance may result in legal issues or service interruption

---

## Table of Contents

1. [Legal Requirements](#1-legal-requirements)
2. [Service Key Security](#2-service-key-security)
3. [Rate Limits & Traffic Management](#3-rate-limits--traffic-management)
4. [Technical Pitfalls](#4-technical-pitfalls)
5. [Service Lifecycle Management](#5-service-lifecycle-management)
6. [Personal Data Protection](#6-personal-data-protection)
7. [Common Error Codes & Solutions](#7-common-error-codes--solutions)
8. [CORS & Frontend Integration](#8-cors--frontend-integration) ⭐ NEW
9. [Response Format Handling](#9-response-format-handling) ⭐ NEW
10. [Resilience & Fault Tolerance](#10-resilience--fault-tolerance) ⭐ NEW
11. [Caching Strategies](#11-caching-strategies) ⭐ NEW
12. [Testing Environment Limitations](#12-testing-environment-limitations) ⭐ NEW
13. [Best Practices Checklist](#13-best-practices-checklist)

---

## 1. Legal Requirements

### 1.1 License Types (공공누리)

Korean government data uses the **공공누리 (Korea Open Government License)** system with 4 types:

| Type | Commercial Use | Derivative Works | Requirements |
|------|---------------|------------------|--------------|
| **Type 1** | ✅ Allowed | ✅ Allowed | Source attribution only |
| **Type 2** | ❌ Prohibited | ✅ Allowed | Source attribution |
| **Type 3** | ✅ Allowed | ❌ Prohibited | Source attribution, no modifications |
| **Type 4** | ❌ Prohibited | ❌ Prohibited | Source attribution only |

> **WARNING**: Using Type 2 or Type 4 data for commercial purposes is **ILLEGAL**.

### 1.2 Mandatory Source Attribution

When using public data, you **MUST** include source attribution:

```
출처: [기관명], [데이터명], 공공누리 제[N]유형
Example: 출처: 기상청, 단기예보 조회서비스, 공공누리 제1유형
```

**Full Attribution Format:**
```
본 저작물은 '[기관명]'에서 '[작성년도]' 작성하여 공공누리 제[N]유형으로
개방한 '[저작물명]'을 이용하였으며, 해당 저작물은 '[기관명]
(홈페이지주소)'에서 무료로 다운받으실 수 있습니다.
```

### 1.3 Applicable Laws

| Law | Relevance |
|-----|-----------|
| 공공데이터의 제공 및 이용 활성화에 관한 법률 | Primary law governing public data usage |
| 저작권법 | Copyright obligations |
| 개인정보 보호법 | Personal data protection requirements |
| 위치정보의 보호 및 이용 등에 관한 법률 | Location data handling |

### 1.4 Dispute Resolution

If data provision is denied:
- File a dispute with **공공데이터분쟁조정위원회**
- Deadline: **Within 60 days** of denial notification
- Portal: [data.go.kr](https://www.data.go.kr/)

---

## 2. Service Key Security

### 2.1 Critical Security Rules

| Rule | Description |
|------|-------------|
| **Never commit to Git** | Service keys must NEVER be in source code repositories |
| **Use environment variables** | Store keys in `.env` files (gitignored) |
| **Server-side only** | Never expose keys in client-side JavaScript |
| **Regular rotation** | Keys expire after **2 years** - plan for renewal |

### 2.2 Secure Key Storage

**DO:**
```bash
# .env file (gitignored)
PUBLIC_DATA_API_KEY=your_decoded_key_here
```

```javascript
// Server-side code
const apiKey = process.env.PUBLIC_DATA_API_KEY;
```

**DON'T:**
```javascript
// NEVER do this - exposed in browser
const apiKey = "abcd1234..."; // SECURITY RISK!
fetch(`https://api.data.go.kr?serviceKey=${apiKey}`);
```

### 2.3 Key Types

| Type | When to Use | Example |
|------|-------------|---------|
| **Encoded Key** | Browser, Postman, direct URL | `abc%2Fdef%3D%3D` |
| **Decoded Key** | Server-side frameworks (Spring, Node.js) | `abc/def==` |

> **TIP**: Most server frameworks auto-encode URLs. Use the **Decoded Key** to avoid double-encoding.

### 2.4 Key Reissuance

- Reissuing a new key **automatically invalidates** the old key
- Update all deployments immediately after reissuance
- Test thoroughly before deploying to production

---

## 3. Rate Limits & Traffic Management

### 3.1 Default Limits

| Account Type | Daily Limit | Use Case |
|--------------|-------------|----------|
| **Development (개발계정)** | 1,000 calls/day | Testing & development |
| **Production (운영계정)** | 100,000 calls/day | Live applications |

### 3.2 Upgrading Limits

**Step 1: Register Usage Case (활용사례 등록)**
- Go to My Page → 활용사례 등록
- Describe your application and expected traffic
- Wait for approval (1-3 business days)

**Step 2: Request Traffic Increase**
- After approval, request higher limits
- Production accounts can request up to 1,000,000 calls/day

### 3.3 Traffic Restriction Triggers

Your API access may be **restricted** if:

| Violation | Consequence |
|-----------|-------------|
| Commercial use of non-commercial API | Immediate suspension |
| Exceeding traffic limits repeatedly | Temporary suspension |
| Abnormal access patterns (suspected abuse) | Investigation & possible ban |
| Violating terms of service | Permanent ban |

### 3.4 Rate Limit Best Practices

```javascript
// Implement exponential backoff
async function fetchWithRetry(url, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);
      if (response.status === 429) { // Rate limited
        const waitTime = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        await sleep(waitTime);
        continue;
      }
      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
    }
  }
}
```

---

## 4. Technical Pitfalls

### 4.1 URL Encoding Issues

**The Most Common Error**: `SERVICE_KEY_IS_NOT_REGISTERED_ERROR`

**Cause**: Double encoding or wrong key type

| Framework | Solution |
|-----------|----------|
| Browser/Postman | Use **Encoded** key |
| Spring Boot | Use **Decoded** key |
| Node.js (axios) | Use **Decoded** key, let axios encode |
| Python (requests) | Use **Decoded** key |

**Correct Python Example:**
```python
import requests

# Use DECODED key - requests library handles encoding
service_key = "abc/def=="  # NOT "abc%2Fdef%3D%3D"

params = {
    'serviceKey': service_key,
    'pageNo': 1,
    'numOfRows': 10,
    'dataType': 'JSON'
}

response = requests.get(base_url, params=params)
```

### 4.2 Character Encoding

| Issue | Solution |
|-------|----------|
| Korean text garbled | Ensure UTF-8 encoding throughout |
| CSV file encoding | Use `encoding='cp949'` or `encoding='euc-kr'` for legacy files |
| XML response encoding | Parse with UTF-8: `xml.etree.ElementTree.fromstring(response.content)` |

**Pandas CSV Example:**
```python
# For legacy Korean government CSV files
df = pd.read_csv('data.csv', encoding='cp949')

# Or try multiple encodings
for enc in ['utf-8', 'cp949', 'euc-kr']:
    try:
        df = pd.read_csv('data.csv', encoding=enc)
        break
    except UnicodeDecodeError:
        continue
```

### 4.3 Date/Time Format

Most Korean APIs use specific date formats:

| Parameter | Format | Example |
|-----------|--------|---------|
| `base_date` | YYYYMMDD | `20260205` |
| `base_time` | HHMM | `0500` |
| `tm` | YYYYMMDDHHMM | `202602050500` |

> **WARNING**: Leading zeros are required. `500` will fail; use `0500`.

### 4.4 Coordinate Systems

Korean APIs use different coordinate systems:

| System | Code | Used By |
|--------|------|---------|
| WGS84 | EPSG:4326 | GPS, international standard |
| GRS80/UTM-K | EPSG:5179 | Korean government mapping |
| Bessel/TM | EPSG:2097 | Legacy systems |

**Coordinate Conversion:**
```python
from pyproj import Transformer

# WGS84 to UTM-K
transformer = Transformer.from_crs("EPSG:4326", "EPSG:5179")
x, y = transformer.transform(37.5665, 126.9780)  # Seoul coordinates
```

---

## 5. Service Lifecycle Management

### 5.1 Service Key Expiration

| Event | Timeline | Action Required |
|-------|----------|-----------------|
| Key issued | Day 0 | Start using API |
| 6 months before expiry | Month 18 | Plan renewal |
| Key expires | Month 24 | **Service stops working** |

> **CRITICAL**: Keys expire after **2 years**. Set calendar reminders!

### 5.2 API Deprecation Process

When an API is deprecated:

1. **Notice posted** on data.go.kr (usually 3-6 months in advance)
2. **Email notification** sent to registered users
3. **Grace period** for migration
4. **Service termination**

**Recent Examples:**
- 국토교통부 TAGO OPEN API (13종) → New APIs available
- 서울특별시 일부 OPEN API → Replaced with updated versions

### 5.3 Monitoring Service Health

**Subscribe to Notifications:**
1. Log in to data.go.kr
2. Go to My Page → 알림 설정
3. Enable email/SMS notifications

**Check Service Status:**
- Official announcements: https://www.data.go.kr/bbs/ntc/selectNoticeList.do
- Support: 1566-0025

### 5.4 Migration Strategy

```javascript
// Implement fallback mechanisms
const API_ENDPOINTS = {
  primary: 'https://apis.data.go.kr/v2/weather',
  fallback: 'https://apis.data.go.kr/v1/weather',  // Legacy
};

async function getWeatherData() {
  try {
    return await fetch(API_ENDPOINTS.primary);
  } catch (error) {
    console.warn('Primary API failed, trying fallback');
    return await fetch(API_ENDPOINTS.fallback);
  }
}
```

---

## 6. Personal Data Protection

### 6.1 Legal Obligations

Under **개인정보 보호법**, you must:

| Obligation | Description |
|------------|-------------|
| **Purpose limitation** | Use data only for stated purposes |
| **Minimum collection** | Collect only what's necessary |
| **Accuracy maintenance** | Keep data accurate and current |
| **Security measures** | Implement appropriate safeguards |
| **Retention limits** | Delete when purpose is fulfilled |

### 6.2 Data Classification

| Data Type | Example | Handling |
|-----------|---------|----------|
| **Public data** | Weather, statistics | Free to use with attribution |
| **Anonymized data** | Aggregated statistics | Can be used freely |
| **Pseudonymized data** | Masked identifiers | Restricted usage |
| **Personal data** | Names, addresses | Requires consent |

### 6.3 APIs with Personal Data

Some APIs may return personal information:

| API Category | Potential PII | Precautions |
|--------------|---------------|-------------|
| Business registration | Representative name, address | Don't store unnecessarily |
| Real estate transactions | Buyer/seller info (masked) | Don't attempt de-anonymization |
| Healthcare facilities | Doctor names | Limited retention |

### 6.4 Compliance Checklist

- [ ] Privacy policy updated to reflect API data usage
- [ ] Data retention period defined
- [ ] Security measures implemented
- [ ] Staff trained on data handling
- [ ] Incident response plan in place

---

## 7. Common Error Codes & Solutions

### 7.1 Standard Error Codes

| Code | Message | Cause | Solution |
|------|---------|-------|----------|
| `00` | NORMAL_CODE | Success | - |
| `01` | APPLICATION_ERROR | Server error | Retry later |
| `02` | DB_ERROR | Database error | Retry later |
| `03` | NODATA_ERROR | No results | Check parameters |
| `04` | HTTP_ERROR | Connection failed | Check network |
| `05` | SERVICETIME_OUT | Timeout | Retry with smaller request |
| `10` | INVALID_REQUEST_PARAMETER_ERROR | Bad parameters | Verify parameter format |
| `11` | NO_MANDATORY_REQUEST_PARAMETERS_ERROR | Missing required param | Add required parameters |
| `12` | NO_OPENAPI_SERVICE_ERROR | Service not found | Check API URL |
| `20` | SERVICE_ACCESS_DENIED_ERROR | Access denied | Check permissions |
| `21` | SERVICE_REQUEST_LIMIT_EXCEEDED_ERROR | Rate limited | Wait or upgrade plan |
| `22` | SERVICE_KEY_IS_NOT_REGISTERED_ERROR | Invalid key | Check key encoding |
| `30` | KEY_EXPIRED_ERROR | Key expired | Reissue key |
| `31` | UNREGISTERED_IP_ERROR | IP not allowed | Register IP |

### 7.2 Troubleshooting Flowchart

```
API Call Failed
    │
    ├─ Error Code 22?
    │   └─ Check: Using correct key type (encoded vs decoded)?
    │
    ├─ Error Code 21?
    │   └─ Wait 24 hours or upgrade to production account
    │
    ├─ Error Code 30?
    │   └─ Reissue key in My Page (old key will be invalidated)
    │
    ├─ Error Code 03?
    │   └─ Verify parameters (date format, coordinates, etc.)
    │
    └─ Error Code 01/02/04/05?
        └─ Retry with exponential backoff
```

### 7.3 Debug Checklist

```bash
# 1. Test with curl first
curl "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?\
serviceKey=YOUR_ENCODED_KEY&\
pageNo=1&\
numOfRows=10&\
dataType=JSON&\
base_date=20260205&\
base_time=0500&\
nx=55&\
ny=127"

# 2. Check response headers
curl -I "https://apis.data.go.kr/..."

# 3. Verify key encoding
echo "YOUR_KEY" | python3 -c "import urllib.parse; print(urllib.parse.quote(input(), safe=''))"
```

---

## 8. CORS & Frontend Integration

### 8.1 The CORS Problem

> **CRITICAL**: Most Korean public APIs do NOT include CORS headers in their responses.

| Scenario | Result |
|----------|--------|
| Browser → Public API | ❌ **BLOCKED** by CORS policy |
| Server → Public API | ✅ Works (no CORS for server-to-server) |
| Browser → Your Proxy → Public API | ✅ Works |

**Browser Error Example:**
```
Access to fetch at 'https://apis.data.go.kr/...' from origin 'http://localhost:3000'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present.
```

### 8.2 Solution: Proxy Server

**Architecture:**
```
┌──────────┐      ┌──────────────┐      ┌─────────────────┐
│ Browser  │ ───▶ │ Your Proxy   │ ───▶ │ Public API      │
│ (Client) │      │ (CORS enabled)│      │ (No CORS)       │
└──────────┘      └──────────────┘      └─────────────────┘
```

**Express.js Proxy Example:**
```javascript
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors()); // Enable CORS for all origins

app.get('/api/weather', async (req, res) => {
  try {
    const response = await axios.get('https://apis.data.go.kr/1360000/...', {
      params: {
        serviceKey: process.env.PUBLIC_DATA_API_KEY,
        ...req.query
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001);
```

### 8.3 Alternative Solutions

| Solution | Pros | Cons |
|----------|------|------|
| **Self-hosted Proxy** | Full control | Maintenance required |
| **Serverless Functions** | No server management | Cold start latency |
| **API Gateway (AWS/GCP)** | Scalable | Cost at scale |
| **Netlify/Vercel Rewrites** | Easy for static sites | Platform lock-in |

**Vercel `vercel.json` Example:**
```json
{
  "rewrites": [
    {
      "source": "/api/public/:path*",
      "destination": "https://apis.data.go.kr/:path*"
    }
  ]
}
```

**Netlify `netlify.toml` Example:**
```toml
[[redirects]]
  from = "/api/public/*"
  to = "https://apis.data.go.kr/:splat"
  status = 200
  force = true
```

### 8.4 Security Considerations

| Risk | Mitigation |
|------|------------|
| API key exposure | Keep key server-side only |
| Proxy abuse | Rate limit your proxy |
| Open relay | Whitelist allowed endpoints |

```javascript
// Whitelist allowed API paths
const ALLOWED_PATHS = [
  '/1360000/VilageFcstInfoService_2.0',
  '/1613000/BusArrInfoService',
];

app.use('/api/proxy', (req, res, next) => {
  const targetPath = req.query.path;
  if (!ALLOWED_PATHS.some(p => targetPath.startsWith(p))) {
    return res.status(403).json({ error: 'Path not allowed' });
  }
  next();
});
```

---

## 9. Response Format Handling

### 9.1 The Hidden Problem

> **WARNING**: Public APIs may return XML even when JSON is requested, especially during errors.

| Situation | Expected | Actual |
|-----------|----------|--------|
| Normal response | JSON | JSON ✓ |
| Gateway error | JSON | **XML** ❌ |
| Auth error | JSON | **XML** ❌ |
| Rate limit | JSON | **XML** ❌ |
| Server error | JSON | **XML** ❌ |

**Dangerous Pattern:**
```javascript
// ❌ DANGEROUS: Will crash on XML response
const response = await fetch(url);
const data = await response.json(); // Throws SyntaxError on XML
```

### 9.2 Safe Response Parsing

**JavaScript/TypeScript:**
```javascript
async function safeApiCall(url) {
  const response = await fetch(url);
  const text = await response.text();

  // Check if response is XML (error response)
  if (text.trim().startsWith('<?xml') || text.trim().startsWith('<')) {
    // Parse XML to extract error info
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, 'text/xml');

    const errMsg = xmlDoc.querySelector('errMsg')?.textContent;
    const returnReasonCode = xmlDoc.querySelector('returnReasonCode')?.textContent;

    throw new ApiError({
      code: returnReasonCode,
      message: errMsg || 'Unknown XML error',
      rawResponse: text
    });
  }

  // Parse as JSON
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new ApiError({
      code: 'PARSE_ERROR',
      message: 'Failed to parse response',
      rawResponse: text
    });
  }
}
```

**Python:**
```python
import requests
import json
import xml.etree.ElementTree as ET

def safe_api_call(url, params):
    response = requests.get(url, params=params)
    text = response.text.strip()

    # Check for XML response
    if text.startswith('<?xml') or text.startswith('<'):
        root = ET.fromstring(text)
        err_msg = root.find('.//errMsg')
        err_code = root.find('.//returnReasonCode')
        raise ApiError(
            code=err_code.text if err_code is not None else 'UNKNOWN',
            message=err_msg.text if err_msg is not None else 'XML Error'
        )

    return json.loads(text)
```

### 9.3 HTTP Status Code Caveat

> **IMPORTANT**: HTTP 200 does NOT mean success!

```javascript
// ❌ WRONG: HTTP 200 can still contain error
if (response.ok) {
  const data = await response.json();
  return data; // May contain error in body!
}

// ✅ CORRECT: Always check response body
const data = await safeApiCall(url);
if (data.response?.header?.resultCode !== '00') {
  throw new Error(data.response?.header?.resultMsg);
}
return data.response.body;
```

### 9.4 Common Response Structures

**Success Response (JSON):**
```json
{
  "response": {
    "header": {
      "resultCode": "00",
      "resultMsg": "NORMAL_CODE"
    },
    "body": {
      "items": { ... },
      "numOfRows": 10,
      "pageNo": 1,
      "totalCount": 100
    }
  }
}
```

**Error Response (XML - even when JSON requested):**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<OpenAPI_ServiceResponse>
  <cmmMsgHeader>
    <errMsg>SERVICE_KEY_IS_NOT_REGISTERED_ERROR</errMsg>
    <returnAuthMsg>SERVICE_KEY_IS_NOT_REGISTERED_ERROR</returnAuthMsg>
    <returnReasonCode>30</returnReasonCode>
  </cmmMsgHeader>
</OpenAPI_ServiceResponse>
```

---

## 10. Resilience & Fault Tolerance

### 10.1 Why Resilience Matters

Public APIs are **less reliable** than commercial APIs:

| Issue | Frequency | Impact |
|-------|-----------|--------|
| Scheduled maintenance | Monthly | Complete outage |
| Unscheduled downtime | Occasional | Complete outage |
| Slow responses | Common | Timeout errors |
| Intermittent auth errors | Frequent | Random failures |
| Rate limiting | Common | Request rejection |

### 10.2 Circuit Breaker Pattern

Prevent cascade failures by stopping requests to failing services:

```javascript
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 30000;
    this.failures = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }

  async call(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime >= this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
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

  onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }
}

// Usage
const weatherCircuit = new CircuitBreaker({ failureThreshold: 3, resetTimeout: 60000 });

async function getWeather() {
  return weatherCircuit.call(() => fetchWeatherAPI());
}
```

### 10.3 Retry with Exponential Backoff

```javascript
async function retryWithBackoff(fn, options = {}) {
  const maxRetries = options.maxRetries || 3;
  const baseDelay = options.baseDelay || 1000;
  const maxDelay = options.maxDelay || 30000;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;

      // Don't retry on certain errors
      if (error.code === '22' || error.code === '30') {
        throw error; // Auth errors - don't retry
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      const jitter = delay * 0.1 * Math.random();
      await sleep(delay + jitter);
    }
  }
}

// Usage
const data = await retryWithBackoff(
  () => fetchPublicAPI(params),
  { maxRetries: 3, baseDelay: 1000 }
);
```

### 10.4 Fallback Strategies

| Strategy | Use Case | Example |
|----------|----------|---------|
| **Cached data** | Recent data acceptable | Weather from 1 hour ago |
| **Default values** | Static fallback | Default coordinates |
| **Alternative API** | Redundancy | Backup weather service |
| **Graceful degradation** | Partial functionality | Hide weather widget |

```javascript
async function getWeatherWithFallback(location) {
  try {
    // Primary: Public API
    return await fetchWeatherAPI(location);
  } catch (error) {
    console.warn('Primary API failed:', error.message);

    // Fallback 1: Cache
    const cached = await cache.get(`weather:${location}`);
    if (cached && cached.timestamp > Date.now() - 3600000) {
      return { ...cached.data, _fromCache: true };
    }

    // Fallback 2: Alternative API
    try {
      return await fetchBackupWeatherAPI(location);
    } catch (backupError) {
      // Fallback 3: Default response
      return {
        _fallback: true,
        message: 'Weather data temporarily unavailable',
        lastUpdated: null
      };
    }
  }
}
```

### 10.5 Health Monitoring

```javascript
class APIHealthMonitor {
  constructor(apis) {
    this.apis = apis; // [{ name, healthCheckUrl, interval }]
    this.status = {};
  }

  async checkHealth(api) {
    const start = Date.now();
    try {
      const response = await fetch(api.healthCheckUrl, { timeout: 5000 });
      const latency = Date.now() - start;

      this.status[api.name] = {
        healthy: response.ok,
        latency,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      this.status[api.name] = {
        healthy: false,
        error: error.message,
        lastCheck: new Date().toISOString()
      };
    }
  }

  startMonitoring() {
    this.apis.forEach(api => {
      setInterval(() => this.checkHealth(api), api.interval || 60000);
    });
  }

  getStatus() {
    return this.status;
  }
}

// Usage
const monitor = new APIHealthMonitor([
  { name: 'Weather', healthCheckUrl: '...', interval: 60000 },
  { name: 'Bus', healthCheckUrl: '...', interval: 30000 },
]);
monitor.startMonitoring();
```

---

## 11. Caching Strategies

### 11.1 Why Caching is Essential

| Benefit | Impact |
|---------|--------|
| Reduce API calls | Stay under rate limits |
| Improve performance | Faster response times |
| Cost savings | Fewer requests = lower costs |
| Resilience | Serve cached data during outages |

### 11.2 Cache TTL Guidelines

| Data Type | Recommended TTL | Rationale |
|-----------|-----------------|-----------|
| Holidays (특일정보) | 24 hours | Changes rarely |
| Weather forecast | 1 hour | Updated hourly |
| Real estate prices | 6-12 hours | Updated daily |
| Bus arrival | 30-60 seconds | Real-time needed |
| Business registration | 24 hours | Rarely changes |
| Address lookup | 7 days | Very stable |

### 11.3 Caching Implementations

**In-Memory Cache (Node.js):**
```javascript
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 3600 }); // 1 hour default

async function getCachedWeather(location) {
  const key = `weather:${location}`;

  // Check cache
  const cached = cache.get(key);
  if (cached) return cached;

  // Fetch and cache
  const data = await fetchWeatherAPI(location);
  cache.set(key, data);
  return data;
}
```

**Redis Cache:**
```javascript
const Redis = require('ioredis');
const redis = new Redis();

async function getCachedData(key, fetchFn, ttlSeconds) {
  // Try cache
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  // Fetch fresh data
  const data = await fetchFn();

  // Store in cache
  await redis.setex(key, ttlSeconds, JSON.stringify(data));
  return data;
}

// Usage
const weather = await getCachedData(
  `weather:seoul`,
  () => fetchWeatherAPI('seoul'),
  3600 // 1 hour
);
```

**HTTP Cache Headers (Express):**
```javascript
app.get('/api/holidays', async (req, res) => {
  const data = await getHolidays(req.query.year);

  // Cache for 24 hours
  res.set('Cache-Control', 'public, max-age=86400');
  res.json(data);
});

app.get('/api/bus-arrival', async (req, res) => {
  const data = await getBusArrival(req.query.stopId);

  // Cache for 30 seconds
  res.set('Cache-Control', 'public, max-age=30');
  res.json(data);
});
```

### 11.4 Cache Invalidation Strategies

| Strategy | When to Use |
|----------|-------------|
| **TTL-based** | Most common, simple |
| **Event-based** | When updates are known |
| **Manual purge** | Admin-triggered |
| **Stale-while-revalidate** | High availability needed |

**Stale-While-Revalidate Pattern:**
```javascript
async function getWithSWR(key, fetchFn, options = {}) {
  const { staleTime = 3600, maxAge = 86400 } = options;

  const cached = await cache.get(key);
  const now = Date.now();

  if (cached) {
    const age = now - cached.timestamp;

    // Fresh: return immediately
    if (age < staleTime * 1000) {
      return cached.data;
    }

    // Stale but usable: return cached, refresh in background
    if (age < maxAge * 1000) {
      // Background refresh (don't await)
      fetchFn().then(data => {
        cache.set(key, { data, timestamp: Date.now() });
      });
      return cached.data;
    }
  }

  // Expired or no cache: fetch synchronously
  const data = await fetchFn();
  await cache.set(key, { data, timestamp: now });
  return data;
}
```

---

## 12. Testing Environment Limitations

### 12.1 What's NOT Available

Unlike commercial APIs, public data APIs lack:

| Feature | Commercial APIs | Public Data Portal |
|---------|----------------|-------------------|
| Sandbox environment | ✅ | ❌ |
| Mock data | ✅ | ❌ |
| Test API keys | ✅ | ❌ (dev account only) |
| Staging server | ✅ | ❌ |
| Rate limit bypass for testing | ✅ | ❌ |

### 12.2 Testing Strategies

**1. Record & Replay (VCR Pattern):**
```javascript
// Using nock for HTTP mocking
const nock = require('nock');

// Record mode: Save actual responses
nock.recorder.rec({
  output_objects: true,
  dont_print: true
});

// Later: Replay recorded responses
const recordings = require('./fixtures/weather-api.json');
recordings.forEach(recording => {
  nock(recording.scope)
    .get(recording.path)
    .reply(recording.status, recording.response);
});
```

**2. Local Mock Server:**
```javascript
// mock-server.js
const express = require('express');
const app = express();

// Load fixture data
const weatherFixture = require('./fixtures/weather.json');
const busFixture = require('./fixtures/bus.json');

app.get('/weather', (req, res) => {
  res.json(weatherFixture);
});

app.get('/bus', (req, res) => {
  res.json(busFixture);
});

app.listen(3002, () => console.log('Mock server running'));
```

**3. Environment-based API URL:**
```javascript
const API_BASE = process.env.NODE_ENV === 'test'
  ? 'http://localhost:3002'  // Mock server
  : 'https://apis.data.go.kr';

async function fetchWeather(params) {
  return fetch(`${API_BASE}/weather?${new URLSearchParams(params)}`);
}
```

### 12.3 Fixture Management

**Directory Structure:**
```
tests/
├── fixtures/
│   ├── weather/
│   │   ├── success.json
│   │   ├── no-data.json
│   │   └── error-auth.xml
│   ├── bus/
│   │   ├── arrival.json
│   │   └── no-service.json
│   └── README.md
├── mocks/
│   └── api-server.js
└── integration/
    └── weather.test.js
```

**Fixture Creation Script:**
```bash
#!/bin/bash
# scripts/capture-fixtures.sh

# Capture weather API response
curl "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?\
serviceKey=${API_KEY}&pageNo=1&numOfRows=10&dataType=JSON&\
base_date=20260205&base_time=0500&nx=55&ny=127" \
  > tests/fixtures/weather/success.json

echo "Fixtures captured!"
```

### 12.4 Integration Testing Tips

```javascript
describe('Weather API Integration', () => {
  // Use real API in CI with limited calls
  const isCI = process.env.CI === 'true';

  beforeAll(() => {
    if (!isCI) {
      // Local: use mock server
      setupMockServer();
    }
  });

  it('should fetch weather data', async () => {
    const data = await getWeather({ nx: 55, ny: 127 });

    expect(data.response.header.resultCode).toBe('00');
    expect(data.response.body.items).toBeDefined();
  });

  // Skip rate-limit-sensitive tests in CI
  (isCI ? it.skip : it)('should handle pagination', async () => {
    // This test makes multiple API calls
    const allData = await fetchAllPages();
    expect(allData.length).toBeGreaterThan(100);
  });
});
```

### 12.5 PublicDataReader (Python)

For Python developers, use the `PublicDataReader` library:

```python
# Install: pip install PublicDataReader

from PublicDataReader import TransactionPrice

# Initialize with your service key
api = TransactionPrice(service_key="YOUR_DECODED_KEY")

# Fetch apartment transaction data
df = api.get_data(
    property_type="아파트",
    trade_type="매매",
    sigungu_code="11110",  # 종로구
    year_month="202601"
)

print(df.head())
```

**Benefits:**
- Handles encoding automatically
- Parses responses into pandas DataFrames
- Built-in error handling
- Great for data analysis and testing

---

## 13. Best Practices Checklist

### Before Development

- [ ] Read API documentation thoroughly
- [ ] Check license type (공공누리 유형)
- [ ] Verify commercial use is allowed (if applicable)
- [ ] Register and get API key
- [ ] Test with development account first
- [ ] **Plan proxy server architecture (CORS)** ⭐
- [ ] **Prepare test fixtures for offline development** ⭐

### During Development

- [ ] Store API key in environment variables
- [ ] Implement proper error handling
- [ ] Add retry logic with exponential backoff
- [ ] Use correct encoding for your framework
- [ ] Cache responses when appropriate
- [ ] Log API calls for debugging
- [ ] **Handle both JSON and XML responses** ⭐
- [ ] **Implement Circuit Breaker pattern** ⭐
- [ ] **Set appropriate cache TTL per data type** ⭐

### Before Production

- [ ] Upgrade to production account
- [ ] Register usage case (활용사례)
- [ ] Request appropriate traffic limits
- [ ] Set up monitoring for API health
- [ ] Plan for key renewal (2-year expiry)
- [ ] **Deploy and test proxy server** ⭐
- [ ] **Configure production caching (Redis)** ⭐
- [ ] **Set up health monitoring for APIs** ⭐

### In Production

- [ ] Monitor rate limit usage
- [ ] Subscribe to service announcements
- [ ] Implement fallback mechanisms
- [ ] Regular security audits
- [ ] Keep source attribution visible
- [ ] **Monitor cache hit rates** ⭐
- [ ] **Track API response times** ⭐
- [ ] **Alert on Circuit Breaker state changes** ⭐

### Compliance

- [ ] Source attribution displayed
- [ ] License terms followed
- [ ] Personal data protected
- [ ] Privacy policy updated
- [ ] Data retention policies enforced

### Architecture (NEW) ⭐

- [ ] CORS proxy implemented (not calling from browser directly)
- [ ] Response format validation (JSON/XML handling)
- [ ] Fallback data sources identified
- [ ] Caching layer configured
- [ ] Retry and Circuit Breaker in place
- [ ] Test fixtures maintained and updated

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│                 PUBLIC API QUICK REFERENCE                  │
├─────────────────────────────────────────────────────────────┤
│ Portal:       https://www.data.go.kr/                       │
│ Support:      1566-0025 / support@data.go.kr                │
│ Key Expiry:   2 years from issuance                         │
│                                                             │
│ RATE LIMITS                                                 │
│ ├─ Development: 1,000 calls/day                             │
│ └─ Production:  100,000 calls/day (upgradable)              │
│                                                             │
│ KEY TYPES                                                   │
│ ├─ Encoded: For browsers, Postman                           │
│ └─ Decoded: For server frameworks                           │
│                                                             │
│ COMMON ERRORS                                               │
│ ├─ Code 22: Wrong key encoding                              │
│ ├─ Code 21: Rate limit exceeded                             │
│ └─ Code 30: Key expired                                     │
│                                                             │
│ LICENSE (공공누리)                                           │
│ ├─ Type 1: Commercial ✓ Derivatives ✓                       │
│ ├─ Type 2: Commercial ✗ Derivatives ✓                       │
│ ├─ Type 3: Commercial ✓ Derivatives ✗                       │
│ └─ Type 4: Commercial ✗ Derivatives ✗                       │
│                                                             │
│ CRITICAL GOTCHAS (v1.1 NEW)                                 │
│ ├─ CORS: Browser calls BLOCKED → Use proxy server           │
│ ├─ Response: May return XML even when JSON requested        │
│ ├─ HTTP 200: Check body for errors (200 ≠ success)          │
│ └─ Sandbox: None available → Use fixtures for testing       │
│                                                             │
│ RECOMMENDED CACHE TTL                                       │
│ ├─ Holidays:     24 hours                                   │
│ ├─ Weather:      1 hour                                     │
│ ├─ Real estate:  6 hours                                    │
│ └─ Bus arrival:  30 seconds                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-05 | Initial document creation |
| 1.1.0 | 2026-02-05 | Added CORS, Response Handling, Resilience, Caching, Testing sections |

---

## References

### Official Resources

- [공공데이터포털](https://www.data.go.kr/)
- [공공누리 유형 안내](https://www.copyright.or.kr/gov/nuri/guide/index.do)
- [공공데이터의 제공 및 이용 활성화에 관한 법률](https://www.law.go.kr/)
- [개인정보 보호법](https://www.law.go.kr/)
- [공공데이터 품질 제고](https://www.mois.go.kr/frt/sub/a06/b02/openData_3/screen.do)

### Technical References

- [SERVICE_KEY_IS_NOT_REGISTERED_ERROR 해결](https://velog.io/@yeahg_dev/공공데이터포털-SERVICEKEYISNOTREGISTEREDERROR-원인-파헤치기)
- [공공데이터포털 오픈 API의 XML 문제](https://kdev.ing/data-go-openapi/)
- [공공데이터 API CORS 이슈 해결](https://velog.io/@yoonyounghoon/공공데이터-API-CORS-이슈-해결을-위해-직접-프록시-서버-구축하기)
- [외부 API 장애 대응 (Circuit Breaker)](https://saramin.github.io/2020-12-18-post-api-with-circuit-breaker/)
- [HTTP 캐시로 API 속도 올리기](https://bbirec.medium.com/http-캐쉬로-api-속도-올리기-2effb1bfab12)

### Tools & Libraries

- [PublicDataReader (Python)](https://github.com/WooilJeong/PublicDataReader) - 공공데이터 조회 라이브러리
- [public-apis-4Kr (GitHub)](https://github.com/yybmion/public-apis-4Kr) - 한국 공공 API 모음

---

*This document is maintained as part of the public_api project documentation.*
