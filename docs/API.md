# Warmthly API Documentation

Complete API reference for all Warmthly backend endpoints and utilities.

## Table of Contents

- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Email](#email)
- [Airtable](#airtable)
- [i18n](#i18n)
- [Payments](#payments)
- [Utilities](#utilities)

---

## Authentication

### POST `/api/login`

Authenticates admin users and issues JWT tokens.

**Security Features:**

- Constant-time password comparison (prevents timing attacks)
- Rate limiting: 5 attempts per 15 minutes
- JWT token expiration: 8 hours

**Request Body:**

```json
{
  "password": "admin_password"
}
```

**Success Response (200):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**

- `401` - Incorrect password
- `405` - Method not allowed
- `429` - Too many requests (rate limited)
- `500` - Server configuration error

**Environment Variables:**

- `ADMIN_PASSWORD` - Admin password (required)
- `JWT_SECRET` - JWT signing secret (required)

**Example - cURL:**

```bash
curl -X POST https://warmthly.org/api/login \
  -H "Content-Type: application/json" \
  -d '{"password": "admin_password"}'
```

**Example - JavaScript:**

```javascript
async function login(password) {
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Login failed');
    }

    const data = await response.json();
    // Store token securely
    localStorage.setItem('authToken', data.token);
    return data.token;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}
```

**Example - Error Handling:**

```javascript
async function loginWithErrorHandling(password) {
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      throw new Error(`Rate limited. Retry after ${retryAfter} seconds`);
    }

    if (response.status === 401) {
      throw new Error('Incorrect password');
    }

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}
```

---

## Rate Limiting

All API endpoints use Redis-based sliding window rate limiting.

### Rate Limit Headers

All responses include rate limit headers:

- `X-RateLimit-Limit` - Maximum requests per window
- `X-RateLimit-Remaining` - Remaining requests in current window
- `X-RateLimit-Reset` - ISO timestamp when limit resets
- `Retry-After` - Seconds to wait (only when rate limited)

### Pre-configured Rate Limits

**Login (`loginRateLimitOptions`):**

- Window: 15 minutes
- Max: 5 requests
- Message: "Too many login attempts, please try again later."

**Email (`emailRateLimitOptions`):**

- Window: 1 hour
- Max: 10 requests
- Message: "Too many email requests, please try again later."

**General API (`apiRateLimitOptions`):**

- Window: 15 minutes
- Max: 100 requests
- Message: "Too many requests, please try again later."

**Voting (`voteRateLimitOptions`):**

- Window: 30 days
- Max: 1 request
- Message: "You have already voted. Please wait before voting again."

### Rate Limit Error Response (429)

```json
{
  "error": {
    "message": "Too many requests, please try again later."
  }
}
```

---

## Email

### POST `/api/send-email`

Sends emails via Resend email service.

**Rate Limiting:** 10 requests per hour

**Request Body:**

```json
{
  "to": "recipient@example.com",
  "subject": "Email Subject",
  "html": "<p>Email body HTML</p>"
}
```

**Validation:**

- `to` - Required, valid email format
- `subject` - Required, max 200 characters
- `html` - Required, non-empty HTML content

**Success Response (200):**

```json
{
  "message": "Email sent successfully!",
  "data": { ... }
}
```

**Error Responses:**

- `400` - Invalid input (missing fields, invalid email, empty body)
- `405` - Method not allowed
- `429` - Rate limited
- `500` - Server error or service not configured

**Environment Variables:**

- `RESEND_API_KEY` - Resend API key (required)

**Example - cURL:**

```bash
curl -X POST https://warmthly.org/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "recipient@example.com",
    "subject": "Hello from Warmthly",
    "html": "<p>This is a test email.</p>"
  }'
```

**Example - JavaScript:**

```javascript
async function sendEmail(to, subject, html) {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, html }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to send email');
    }

    const data = await response.json();
    console.log('Email sent:', data.message);
    return data;
  } catch (error) {
    console.error('Email error:', error);
    throw error;
  }
}
```

---

### POST `/api/inbound-email`

Handles inbound emails from Resend.

**Request Body:**

```json
{
  "from": "sender@example.com",
  "subject": "Subject",
  "html": "<p>Body</p>",
  "text": "Body text"
}
```

**Success Response (200):**

```json
{
  "message": "Email received"
}
```

**Environment Variables:**

- `RESEND_WEBHOOK_SECRET` - Webhook secret for verification (optional)

---

## Airtable

### GET `/api/airtable`

Fetches data from Airtable with Redis caching.

**Rate Limiting:** 100 requests per 15 minutes

**Query Parameters:**

- `baseId` (required) - Airtable base ID
- `tableName` (required) - Table name
- `viewId` (optional) - View ID
- `page` (optional) - Page number for pagination

**Caching:**

- Cache TTL: 30 seconds
- Cache key format: `airtable:{baseId}:{tableName}:{viewId}:{page}`
- Response header: `X-Cache` (HIT or MISS)

**Success Response (200):**

```json
{
  "records": [...],
  "offset": "..."
}
```

**Error Responses:**

- `400` - Missing required parameters
- `405` - Method not allowed
- `429` - Rate limited
- `500` - Server error
- `504` - Airtable API timeout (10 seconds)

**Environment Variables:**

- `AIRTABLE_API_KEY` - Airtable API key (required)
- `REDIS_URL` - Redis connection string (required for caching)

**Timeout:** 10 seconds

**Example - cURL:**

```bash
curl "https://warmthly.org/api/airtable?baseId=app123&tableName=Table1&viewId=view456"
```

**Example - JavaScript:**

```javascript
async function fetchAirtableData(baseId, tableName, viewId) {
  try {
    const params = new URLSearchParams({
      baseId,
      tableName,
      ...(viewId && { viewId }),
    });

    const response = await fetch(`/api/airtable?${params}`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const cacheStatus = response.headers.get('X-Cache');
    console.log(`Cache: ${cacheStatus}`);

    return data;
  } catch (error) {
    console.error('Airtable fetch error:', error);
    throw error;
  }
}
```

---

## i18n

### GET `/api/i18n/languages`

Returns list of available languages.

**Success Response (200):**

```json
{
  "languages": ["en", "es", "fr", "de", ...]
}
```

---

### GET `/api/i18n/:language`

Returns all translations for a language.

**Query Parameters:**

- `keys=true` - Returns only translation keys
- `chunked=true` - Returns translations in chunks

**Success Response (200):**

```json
{
  "translations": {
    "common": {
      "loading": "Loading...",
      "error": "Error"
    }
  },
  "version": "1.0.0"
}
```

---

### POST `/api/i18n/:language/chunk`

Fetches specific translation keys.

**Request Body:**

```json
{
  "keys": ["common.loading", "common.error"]
}
```

**Success Response (200):**

```json
{
  "translations": {
    "common.loading": "Loading...",
    "common.error": "Error"
  },
  "keys": ["common.loading", "common.error"],
  "total": 150
}
```

**Features:**

- DeepL integration for automatic translation
- Manual translation priority
- Supports 30+ languages

**Environment Variables:**

- `DEEPL_API_KEY` - DeepL API key (optional, for auto-translation)

---

## Payments

### POST `/api/create-checkout`

Creates a payment checkout session via Yoco.

**Rate Limiting:** 100 requests per 15 minutes

**Request Body:**

```json
{
  "amount": 10000,
  "currency": "ZAR",
  "metadata": {
    "donorName": "John Doe",
    "donorEmail": "john@example.com"
  }
}
```

**Success Response (200):**

```json
{
  "checkoutId": "checkout_...",
  "url": "https://online.yoco.com/checkouts/..."
}
```

**Environment Variables:**

- `YOCO_SECRET_KEY` - Yoco secret key (required)

---

### GET `/api/get-yoco-public-key`

Returns Yoco public key for client-side integration.

**Success Response (200):**

```json
{
  "publicKey": "pk_test_..."
}
```

**Environment Variables:**

- `YOCO_PUBLIC_KEY` - Yoco public key (required)

---

### GET `/api/convert-currency`

Converts currency amounts using ExchangeRate-API.

**Query Parameters:**

- `amount` (required) - Amount to convert
- `from` (required) - Source currency code
- `to` (required) - Target currency code

**Success Response (200):**

```json
{
  "amount": 100,
  "from": "USD",
  "to": "ZAR",
  "rate": 18.5,
  "result": 1850
}
```

**Error Responses:**

- `400` - Invalid parameters
- `500` - Exchange rate API error

---

## Reports

### POST `/api/reports`

Submits a user report (concerns, complaints, media inquiries, etc.).

**Phase 3 Issue 3.19: Enhanced API Documentation**

**Rate Limiting:** 100 requests per 15 minutes

**Security Features:**
- Comprehensive input validation with attack detection
- XSS, SQL injection, path traversal, command injection, and LDAP injection detection
- HTML sanitization for email content
- Attack attempts are logged for security monitoring

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "type": "concern",
  "message": "I have a concern about..."
}
```

**Request Fields:**
- `name` (required, string, max 200 chars) - Reporter's name
- `email` (required, string, valid email format) - Reporter's email
- `type` (required, string) - Report type: `"media"`, `"concern"`, `"admin"`, or `"other"`
- `message` (required, string, max 5000 chars) - Report message

**Success Response (200):**
```json
{
  "message": "Report submitted successfully. We will review it promptly."
}
```

**Error Responses:**
- `400` - Validation error (invalid input, missing fields, attack detected)
- `405` - Method not allowed
- `429` - Too many requests (rate limited)
- `500` - Internal server error

**Error Response Format:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input detected in name field"
  }
}
```

**Error Codes:**
- `VALIDATION_ERROR` - Input validation failed
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

**Example - cURL:**
```bash
curl -X POST https://warmthly.org/api/reports \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "type": "concern",
    "message": "I have a concern about..."
  }'
```

**Example - JavaScript:**
```javascript
async function submitReport(reportData) {
  try {
    const response = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Report submission failed');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Report submission error:', error);
    throw error;
  }
}
```

**Environment Variables:**
- `RESEND_API_KEY` - Resend API key for email notifications (optional)
- `ADMIN_EMAIL` - Admin email address (default: desk@warmthly.org)

---

## Currency Conversion

### GET `/api/convert-currency`

Converts currency amounts using ExchangeRate-API.

**Phase 3 Issue 3.19: Enhanced API Documentation**

**Rate Limiting:** 100 requests per 15 minutes  
**Timeout:** 30 seconds  
**Caching:** 5 minutes (with 1 hour stale-while-revalidate)

**Query Parameters:**
- `amount` (required, number) - Amount to convert (in cents for most currencies)
- `from` (required, string) - Source currency code (ISO 4217)
- `to` (optional, string, default: "ZAR") - Target currency code (ISO 4217)

**Supported Currencies:**
USD, EUR, GBP, JPY, AUD, CAD, CHF, CNY, SEK, NZD, MXN, SGD, HKD, NOK, TRY, RUB, INR, BRL, ZAR, DKK, PLN, TWD, THB, MYR, IDR, CZK, HUF, ILS, CLP, PHP, AED, SAR, BGN, RON, HRK, ISK, KRW, VND, PKR, BDT

**Success Response (200):**
```json
{
  "originalAmount": 10000,
  "convertedAmount": 185000,
  "from": "USD",
  "to": "ZAR",
  "rate": 18.5,
  "formattedOriginal": "100.00",
  "formattedConverted": "1850.00"
}
```

**Response Headers:**
- `Cache-Control: public, max-age=300, stale-while-revalidate=3600, must-revalidate`
- `X-RateLimit-Limit: 100`
- `X-RateLimit-Remaining: 99`
- `X-RateLimit-Reset: 2024-12-19T12:00:00.000Z`

**Error Responses:**
- `400` - Invalid parameters (invalid currency code, invalid amount)
- `405` - Method not allowed
- `429` - Too many requests (rate limited)
- `500` - Exchange rate API error
- `504` - Request timeout

**Error Response Format:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid source currency: XXX"
  }
}
```

**Example - cURL:**
```bash
curl "https://warmthly.org/api/convert-currency?amount=10000&from=USD&to=ZAR"
```

**Example - JavaScript:**
```javascript
async function convertCurrency(amount, from, to = 'ZAR') {
  try {
    const response = await fetch(
      `/api/convert-currency?amount=${amount}&from=${from}&to=${to}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Currency conversion failed');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Currency conversion error:', error);
    throw error;
  }
}
```

**Environment Variables:**
- `EXCHANGE_RATE_API_KEY` - ExchangeRate-API key (optional, defaults to free tier)

**Notes:**
- Amounts are in cents for most currencies (e.g., 10000 = $100.00)
- JPY amounts are in whole units (no cents)
- Rates are cached for 5 minutes to reduce API calls
- Stale responses are served for up to 1 hour while revalidating

---

## Inbound Email

### POST `/api/inbound-email`

Processes webhook events from Resend for incoming emails.

**Phase 3 Issue 3.19: Enhanced API Documentation**

**Rate Limiting:** 100 requests per 15 minutes  
**Timeout:** 20 seconds  
**Authentication:** Webhook signature verification required

**Request Headers:**
- `svix-signature` (required) - Webhook signature
- `svix-id` (required) - Webhook ID
- `svix-timestamp` (required) - Webhook timestamp

**Request Body:**
Webhook event from Resend (automatically sent by Resend service)

**Success Response (200):**
```json
{
  "message": "Webhook processed successfully."
}
```

**Error Responses:**
- `400` - Invalid request (missing email data)
- `401` - Webhook verification failed
- `405` - Method not allowed
- `429` - Too many requests (rate limited)
- `500` - Internal server error

**Error Response Format:**
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Error processing webhook."
  }
}
```

**Environment Variables:**
- `RESEND_WEBHOOK_SECRET` - Resend webhook secret (required for production)

**Notes:**
- Emails are stored in Redis for retrieval via `/api/get-emails`
- Only `email.received` events are processed
- Webhook signature is verified using Svix library
- Emails are stored with 7-day retention

---

## CSP Report

### POST `/api/csp-report`

Receives Content Security Policy violation reports.

**Rate Limiting:** 100 requests per 15 minutes

**Request Body:**
CSP violation report (automatically sent by browser)

**Success Response (204):**
No content (report logged server-side)

**Notes:**
- Reports are logged for security monitoring
- No response body required
- Used for CSP policy tuning and security monitoring
- Violation reports are automatically sent by browsers when CSP violations occur
- Reports help identify and fix CSP policy issues

**Error Responses:**
- `400` - Invalid request format
- `405` - Method not allowed
- `429` - Too many requests (rate limited)
- `500` - Internal server error

**Environment Variables:**
- None required (CSP reports are logged only)

**Example - Browser automatically sends:**
```json
{
  "csp-report": {
    "document-uri": "https://warmthly.org/page",
    "violated-directive": "script-src",
    "effective-directive": "script-src",
    "original-policy": "default-src 'self'; script-src 'self'",
    "blocked-uri": "inline",
    "source-file": "https://warmthly.org/page",
    "line-number": 42
  }
}
```

---

## Utilities

### GET `/api/get-emails`

Retrieves stored emails from Redis (admin only).

**Authentication:** Requires JWT token in `Authorization` header

**Headers:**

```
Authorization: Bearer {token}
```

**Success Response (200):**

```json
[
  {
    "from": "sender@example.com",
    "subject": "Subject",
    "html": "<p>Body</p>",
    "timestamp": "2024-01-01T00:00:00Z"
  }
]
```

**Error Responses:**

- `401` - Unauthorized (invalid or missing token)
- `500` - Server error

**Environment Variables:**

- `REDIS_URL` - Redis connection string (required)
- `JWT_SECRET` - JWT verification secret (required)

**Example - cURL:**

```bash
curl https://warmthly.org/api/get-emails \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Example - JavaScript:**

```javascript
async function getEmails(token) {
  try {
    const response = await fetch('/api/get-emails', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      throw new Error('Unauthorized - invalid or expired token');
    }

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const emails = await response.json();
    return emails;
  } catch (error) {
    console.error('Get emails error:', error);
    throw error;
  }
}
```

---

<｜tool▁calls▁begin｜><｜tool▁call▁begin｜>
todo_write

## Common Patterns

### Error Response Format

All errors follow this format:

```json
{
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "details": "Additional details (development only)"
  }
}
```

### Request Timeout

All external API calls have timeout protection:

- Default: 10 seconds
- Configurable via `request-timeout` utility

### Redis Caching

Many endpoints use Redis for caching:

- Cache keys follow pattern: `{service}:{identifier}`
- TTL varies by endpoint (typically 30 seconds to 1 hour)
- Cache failures are non-blocking (fail open)

### Input Validation

All endpoints validate input:

- Required fields checked
- Format validation (emails, URLs, etc.)
- Length limits enforced
- XSS protection via sanitization

---

## Environment Variables Summary

**Required:**

- `ADMIN_PASSWORD` - Admin login password
- `JWT_SECRET` - JWT signing/verification secret
- `AIRTABLE_API_KEY` - Airtable API key
- `RESEND_API_KEY` - Resend email API key
- `YOCO_SECRET_KEY` - Yoco payment secret key
- `YOCO_PUBLIC_KEY` - Yoco payment public key
- `REDIS_URL` - Redis connection string

**Optional:**

- `LIBRETRANSLATE_URL` - LibreTranslate instance URL (self-hosted, private)
- `LIBRETRANSLATE_API_KEY` - LibreTranslate API key (if required)
- `HUGGINGFACE_API_KEY` - Hugging Face API key for NLLB translations (free tier available)
- `RESEND_WEBHOOK_SECRET` - Resend webhook secret
- `NODE_ENV` - Environment (development/production)
- `DEEPL_API_KEY` - (Deprecated) Legacy DeepL support, will be removed

---

## Rate Limiting Implementation

Rate limiting uses Redis sliding window algorithm:

1. **Key Format:** `ratelimit:{identifier}:{endpoint}`
2. **Identifier:** Client IP address (from headers or connection)
3. **Algorithm:** Increment counter, check TTL, set expiration if needed
4. **Fail Open:** If Redis fails, requests are allowed (prevents service disruption)

---

## Security Features

1. **Constant-time comparisons** - Prevents timing attacks
2. **JWT authentication** - Secure token-based auth
3. **Rate limiting** - Prevents abuse
4. **Input validation** - Prevents injection attacks
5. **XSS protection** - HTML sanitization
6. **CORS protection** - Configured per endpoint
7. **Timeout protection** - Prevents hanging requests

---

## Logging

All endpoints use structured logging:

- Format: `[endpoint-name] Message: details`
- Errors include stack traces in development
- Sensitive data is never logged

---

## Testing

API endpoints should be tested for:

- Success cases
- Error cases (400, 401, 429, 500)
- Rate limiting behavior
- Input validation
- Timeout handling
- Cache behavior
