# API Barrel Exports

This directory uses **barrel exports** (index.ts files) to provide a centralized, maintainable way to import API functionality.

## Benefits

✅ **Single Source of Truth** - If a file moves, update only the barrel export  
✅ **Backward Compatible** - All existing imports continue to work  
✅ **Cleaner Imports** - Shorter, more organized import paths  
✅ **Easy Refactoring** - Move files without breaking imports  

## Usage

### Option 1: Direct Imports (Still Works!)

All existing imports continue to work exactly as before:

```typescript
// Endpoints
import airtable from '@api/endpoints/airtable.js';
import { inboundEmail } from '@api/endpoints/inbound-email.js';

// Auth
import login from '@api/auth/login.js';

// Utils
import logger from '@api/utils/logger.js';
import { getRedisClient } from '@api/utils/redis-client.js';

// Middleware
import { withRateLimit, validateEmail } from '@api/middleware/rate-limit.js';
import { validateString } from '@api/middleware/input-validation.js';

// Security
import { withTimeout } from '@api/security/request-timeout.js';
```

### Option 2: Barrel Exports (New!)

Use the new barrel exports for cleaner, more maintainable imports:

```typescript
// Import from specific category
import { airtable, sendEmail, inboundEmail } from '@api/endpoints/index.js';
import { login, mfaSetup } from '@api/auth/index.js';
import { logger, getRedisClient } from '@api/utils/index.js';
import { withRateLimit, validateEmail, validateString } from '@api/middleware/index.js';
import { withTimeout, SecurityLogger } from '@api/security/index.js';
```

### Option 3: Main API Barrel (Most Convenient)

Import everything from the main API barrel:

```typescript
import { endpoints, auth, utils, middleware, security } from '@api/index.js';

// Then use:
const handler = endpoints.airtable;
const loginHandler = auth.login;
const logger = utils.logger;
const client = await utils.getRedisClient();
const rateLimited = middleware.withRateLimit(handler, options);
const timeout = security.withTimeout(handler, 5000);
```

## File Structure

```
api/
├── index.ts              # Main barrel export
├── endpoints/
│   ├── index.ts          # All endpoint exports
│   ├── airtable.ts
│   ├── send-email.ts
│   └── ...
├── auth/
│   ├── index.ts          # All auth exports
│   ├── login.ts
│   └── ...
├── utils/
│   ├── index.ts          # All utility exports
│   ├── logger.ts
│   └── ...
├── middleware/
│   ├── index.ts          # All middleware exports
│   └── ...
└── security/
    ├── index.ts          # All security exports
    └── ...
```

## Migration Guide

**No migration needed!** All existing imports continue to work. You can:

1. **Keep using direct imports** - They work exactly as before
2. **Gradually adopt barrel exports** - Update imports as you touch files
3. **Use barrel exports for new code** - Start using them in new files

## When to Update Barrel Exports

Only update barrel exports when:
- ✅ Adding a new file to a category
- ✅ Moving a file to a different location
- ✅ Renaming a file

**You don't need to update barrel exports when:**
- ❌ Changing file contents
- ❌ Adding new exports to existing files (they're automatically included)
- ❌ Updating implementation details

## Example: Moving a File

**Before:**
```typescript
// File: api/endpoints/old-name.ts
export default handler;
```

**After moving to new location:**
```typescript
// File: api/endpoints/new-name.ts
export default handler;
```

**Update barrel export:**
```typescript
// api/endpoints/index.ts
export { default as newName } from './new-name.js';
// Remove old export
```

**All imports automatically work!** No need to update every file that imports it.

