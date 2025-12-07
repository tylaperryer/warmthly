# API Architecture

This document explains the API architecture and file organization.

## Overview

Warmthly has **two API locations** with different purposes:

1. **`warmthly/api/`** - Local development, testing, and client-side utilities (TypeScript)
2. **`warmthly-api/server.js`** - Production Express.js server deployed on OCI Container Instances

## Directory Structure

### `warmthly/api/` - Local Development & Testing

This directory contains:
- **Organized structure** for local development
- **Test utilities** - Used by test files
- **Client-side validation** - Used by frontend forms
- **Shared utilities** - Can be imported by both frontend and tests

```
warmthly/api/
├── auth/              # Authentication handlers
├── endpoints/         # API endpoint handlers (Node.js format)
├── middleware/       # Middleware (rate limiting, validation)
├── security/         # Security utilities
└── utils/            # Shared utilities (logger, redis, etc.)
```

**Note:** The files in `warmthly/api/endpoints/` use Node.js-style handlers and are **not directly deployed**. They need to be converted to Cloudflare Pages Functions format and moved to `warmthly-api/functions/api/`.

### `warmthly-api/server.js` - Production Server

This is the **actual deployed** Express.js API server running on OCI Container Instances:

```
warmthly-api/
├── server.js                 # Main Express.js server (all endpoints)
├── utils/                    # Server utilities
│   ├── logger.js
│   ├── redis-client.js
│   ├── rate-limit.js
│   └── ...
├── config/                   # Configuration
│   ├── constants.js
│   └── environment.js
└── tests/                    # Integration and load tests
    ├── integration/
    └── load/
```

**Deployment:** The server runs on OCI Container Instances at `http://backend.warmthly.org` (or configured IP).

## Current Status

### ✅ All Endpoints Deployed

All API endpoints are now implemented and deployed in `warmthly-api/server.js`:

- `GET /health` - Health check endpoint
- `POST /api/create-checkout` - Yoco payment checkout
- `POST /api/login` - Admin authentication with MFA/TOTP
- `POST /api/send-email` - Send email via Resend
- `GET /api/get-emails` - Get stored emails (admin only)
- `GET /api/airtable` - Airtable API proxy with caching
- `POST /api/reports` - Submit reports with email notifications
- `POST /api/convert-currency` - Currency conversion via ExchangeRate-API
- `GET /api/get-yoco-public-key` - Get Yoco public key
- `GET /api/i18n/languages` - Get available languages
- `GET /api/i18n/:language` - Get translations for a language
- `POST /api/i18n/:language/chunk` - Get translation chunk

**Deployment Platform:** Oracle Cloud Infrastructure (OCI) Container Instances  
**Server:** Express.js (`warmthly-api/server.js`)  
**Status:** ✅ All endpoints deployed and operational

## File Format Differences

### TypeScript Format (Reference in `warmthly/api/endpoints/`)

Used for local development, testing, and client-side validation:

```typescript
async function handler(req: Request, res: Response): Promise<Response> {
  const apiKey = process.env.API_KEY;
  // ...
  return res.status(200).json(data);
}
export default handler;
```

### Express.js Format (Production in `warmthly-api/server.js`)

Used for production deployment on OCI:

```javascript
app.post('/api/endpoint', withRateLimit(async (req, res) => {
  const apiKey = process.env.API_KEY || secrets.API_KEY;
  // ...
  return res.status(200).json(data);
}));
```

## Client-Side vs Server-Side

### Client-Side (Keep in `warmthly/api/`)

- `middleware/input-validation.ts` - Used by form components
- Any utilities imported by frontend components

### Server-Side (Move to `warmthly-api/functions/lib/`)

- `middleware/rate-limit.ts` - Server-side rate limiting
- `security/*` - Security utilities
- `utils/logger.ts` - Server-side logging
- `utils/redis-client.ts` - Redis connection
- `auth/*` - Authentication handlers

## Import Paths

### In Tests (warmthly/)

```typescript
import handler from '@api/endpoints/airtable.js';
import { validateEmail } from '@api/middleware/input-validation.js';
```

### In Cloudflare Functions (warmthly-api/functions/)

```typescript
import { getRedisClient } from '../lib/utils/redis-client.js';
import { withRateLimit } from '../lib/middleware/rate-limit.js';
```

## Deployment Process

1. **Build:** Docker image is built from `warmthly-api/Dockerfile`
2. **Push:** Image is pushed to OCI Container Registry
3. **Deploy:** Container Instance runs the Express.js server
4. **Routes:** Express.js routes handle all API endpoints:
   - `app.post('/api/create-checkout', ...)` → `/api/create-checkout`
   - `app.get('/api/airtable', ...)` → `/api/airtable`
   - All routes defined in `server.js`

See [OCI-MIGRATION.md](./OCI-MIGRATION.md) for detailed deployment instructions.

## Migration Status

- [x] All endpoints implemented in `warmthly-api/server.js`
- [x] Express.js server deployed on OCI Container Instances
- [x] All endpoints tested and operational
- [x] Integration tests added (`warmthly-api/tests/integration/`)
- [x] Load tests added (`warmthly-api/tests/load/`)
- [x] Documentation updated

**Note:** The TypeScript files in `warmthly/api/` remain as reference implementations for testing and client-side validation.

## See Also

- [API.md](./API.md) - API endpoint documentation
- [API-REORGANIZATION.md](./API-REORGANIZATION.md) - Reorganization plan
- [warmthly-api/README.md](../../warmthly-api/README.md) - API directory README

