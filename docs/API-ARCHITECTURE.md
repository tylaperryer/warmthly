# API Architecture Documentation

## Overview

The Warmthly project uses a **dual API architecture** to support different deployment scenarios:

1. **TypeScript API** (`warmthly/api/`) - For local development and frontend integration
2. **Express.js API** (`warmthly-api/server.js`) - For OCI Container Instances production deployment
3. **Cloudflare Functions** (`warmthly-api/functions/`) - For Cloudflare Pages edge deployment

## Architecture Rationale

### Why Three Implementations?

The three API implementations serve different purposes:

1. **TypeScript API (`warmthly/api/`)**:
   - Used during local development
   - Can be integrated into frontend build process
   - Provides type safety and modern JavaScript features
   - Includes comprehensive validation, rate limiting, and security features

2. **Express.js API (`warmthly-api/server.js`)**:
   - **Primary production API** for OCI Container Instances
   - Handles all backend operations (payments, emails, reports, etc.)
   - Uses Node.js runtime with Express.js framework
   - Deployed via Docker to OCI Container Instances

3. **Cloudflare Functions (`warmthly-api/functions/`)**:
   - Edge functions for Cloudflare Pages deployment
   - Provides low-latency API responses
   - Used for simple operations that don't require full backend infrastructure
   - Currently handles donation checkout creation

## Deployment Flow

```
GitHub Actions
    ↓
    ├─→ Builds frontend (warmthly/)
    │   └─→ Deploys to Cloudflare Pages
    │       └─→ Uses Cloudflare Functions for edge API
    │
    └─→ Builds backend (warmthly-api/)
        └─→ Creates Docker image
            └─→ Pushes to OCI Container Registry
                └─→ Deploys to OCI Container Instances
                    └─→ Express.js API handles all backend operations
```

## API Endpoints

### Shared Endpoints

Both implementations provide similar endpoints, but with different implementations:

- `/api/create-checkout` - Create payment checkout session
- `/api/convert-currency` - Convert currency amounts
- `/api/send-email` - Send email notifications
- `/api/reports` - Submit user reports
- `/api/airtable` - Proxy Airtable API requests

### Implementation Differences

| Feature | TypeScript API | Express.js API | Cloudflare Functions |
|---------|---------------|----------------|---------------------|
| Rate Limiting | ✅ Comprehensive | ✅ Comprehensive | ❌ Not implemented |
| Input Validation | ✅ Comprehensive | ✅ Comprehensive | ⚠️ Basic (now fixed) |
| Error Sanitization | ✅ Yes | ✅ Yes | ✅ Yes (now fixed) |
| CORS Validation | ✅ Exact match | ✅ Exact match | ✅ Exact match (now fixed) |
| Timeout Protection | ✅ Yes | ✅ Yes | ⚠️ Limited |
| Request Signing | ✅ Yes | ✅ Yes | ❌ Not implemented |

## Security Considerations

### CORS Origin Validation

All implementations now use **exact origin matching** to prevent subdomain attacks:

```typescript
// ✅ Secure: Exact match
const isAllowedOrigin = allowedOrigins.includes(origin);

// ❌ Insecure: Substring match (vulnerable to subdomain attacks)
const isAllowedOrigin = allowedOrigins.some(allowed => origin.includes(allowed));
```

### Error Message Sanitization

All implementations sanitize error messages to prevent information leakage:

- Detailed errors are logged server-side only
- Generic error messages are returned to clients
- Error codes are used instead of detailed messages

### Input Validation

All implementations validate inputs:

- Amount validation (type, range, positive)
- Currency validation (whitelist)
- Request body validation
- Attack pattern detection (TypeScript API)

## Code Sharing Strategy

### Current State

Currently, the three implementations are **separate** with some code duplication:

- Validation logic is duplicated
- Error handling patterns differ
- Security measures vary

### Recommended Approach

1. **Shared Validation Utilities**:
   - Extract validation logic to shared modules
   - Use in all three implementations
   - Maintain consistency across deployments

2. **Shared Error Handling**:
   - Use `error-sanitizer.ts` in all implementations
   - Standardize error response format
   - Consistent error codes

3. **Shared Security Utilities**:
   - CORS validation logic
   - Rate limiting configuration
   - Request signing utilities

## Migration Path

### Short Term (Current)

- ✅ Fix security vulnerabilities in all implementations
- ✅ Standardize error handling
- ✅ Add comprehensive input validation to Cloudflare Functions
- ✅ Document architecture and differences

### Medium Term

- Extract shared validation utilities
- Implement rate limiting in Cloudflare Functions
- Standardize error response format
- Add request signing to Cloudflare Functions

### Long Term

- Consider consolidating to single implementation with adapters
- Use shared codebase with deployment-specific wrappers
- Implement comprehensive testing across all implementations

## Testing Strategy

Each implementation should have:

1. **Unit Tests**: Test individual functions and utilities
2. **Integration Tests**: Test API endpoints
3. **Security Tests**: Test CORS, validation, rate limiting
4. **E2E Tests**: Test full payment flow

## Monitoring and Logging

All implementations should:

- Log detailed errors server-side
- Return sanitized errors to clients
- Track security events
- Monitor rate limiting
- Alert on suspicious activity

## Documentation

- This document explains the architecture
- Each implementation has inline documentation
- API endpoints are documented in `warmthly/api/README.md`
- Deployment guides are in `warmthly/docs/DEPLOYMENT-GUIDE.md`

## Questions and Answers

**Q: Why not use a single API implementation?**

A: Different deployment targets (OCI, Cloudflare Pages) require different runtime environments. The Express.js API is optimized for OCI Container Instances, while Cloudflare Functions are optimized for edge deployment.

**Q: Which implementation should I use for new features?**

A: For new features:
- If it requires full backend infrastructure → Express.js API
- If it's a simple edge operation → Cloudflare Functions
- For local development → TypeScript API

**Q: How do I ensure consistency across implementations?**

A: Use shared utilities for:
- Input validation
- Error handling
- Security measures
- Rate limiting configuration

**Q: What about code duplication?**

A: Code duplication is a known issue. The recommended approach is to extract shared utilities and use them across all implementations. This is documented in the migration path.
