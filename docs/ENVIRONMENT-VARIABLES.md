# Environment Variables Guide

This document provides a comprehensive list of all environment variables used in the Warmthly project, organized by deployment target (Frontend/Cloudflare Pages vs Backend/OCI).

## Overview

Warmthly uses environment variables in two main contexts:

1. **Frontend (Cloudflare Pages)** - Set in Cloudflare Pages dashboard for each site
2. **Backend (OCI Container Instances)** - Set via GitHub Secrets and injected during deployment

## Frontend Environment Variables (Cloudflare Pages)

These variables are set in the Cloudflare Pages dashboard for each site (main, mint, post, admin).

### Required Variables

None - Frontend can run without environment variables, but API features require them.

### Optional Variables

#### Translation Services

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LIBRETRANSLATE_URL` | No | - | Self-hosted LibreTranslate instance URL (e.g., `https://translate.yourdomain.com`) |
| `LIBRETRANSLATE_API_KEY` | No | - | LibreTranslate API key (if required by your instance) |
| `HUGGINGFACE_API_KEY` | No | - | Hugging Face API key for NLLB translations (free tier available) |
| `TRANSLATION_CACHE` | No | - | Cloudflare KV namespace for translation caching (optional) |

#### Payment Processing

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `YOCO_SECRET_KEY` | No | - | Yoco payment secret key (for payment API endpoints) |
| `YOCO_PUBLIC_KEY` | No | - | Yoco payment public key (for payment API endpoints) |

**Note:** API functions are deployed with each site, so environment variables should be set in each Cloudflare Pages project (main, mint, post, admin).

### Where to Set (Frontend)

1. Go to Cloudflare Pages dashboard
2. Select the project (warmthly, warmthly-mint, warmthly-post, warmthly-admin)
3. Settings → Environment Variables
4. Add variables for Production, Preview, or both

## Backend Environment Variables (OCI Container Instances)

These variables are set via GitHub Secrets and automatically injected during deployment to OCI Container Instances.

### Required Variables

#### Server Configuration

| Variable | Required | Default | Description | Where to Set |
|----------|----------|---------|-------------|--------------|
| `PORT` | No | `80` | Server port (Greenlock handles both 80 and 443) | GitHub Secrets |
| `LE_EMAIL` | Yes | - | Let's Encrypt email for certificate notifications | GitHub Secrets |
| `LE_STAGING` | No | `false` | Set to `true` for testing Let's Encrypt, `false` for production | GitHub Secrets |

#### Authentication & Security

| Variable | Required | Min Length | Description | Rotation | Where to Set |
|----------|----------|------------|-------------|----------|--------------|
| `JWT_SECRET` | Yes | 32 chars | JWT signing secret for admin authentication | 180 days | GitHub Secrets |
| `ADMIN_PASSWORD` | Yes | 16 chars | Admin login password (hashed) | 90 days | GitHub Secrets |
| `REQUEST_SIGNING_SECRET` | No | 32 chars | HMAC secret for request signing (optional) | 180 days | GitHub Secrets |

#### Payment Processing

| Variable | Required | Min Length | Description | Rotation | Where to Set |
|----------|----------|------------|-------------|----------|--------------|
| `YOCO_SECRET_KEY` | Yes | 32 chars | Yoco payment gateway secret key | 90 days | GitHub Secrets |
| `YOCO_PUBLIC_KEY` | No | - | Yoco payment gateway public key | 90 days | GitHub Secrets |

#### External APIs

| Variable | Required | Min Length | Description | Rotation | Where to Set |
|----------|----------|------------|-------------|----------|--------------|
| `AIRTABLE_API_KEY` | Yes | 17 chars | Airtable API key for data access | 180 days | GitHub Secrets |
| `RESEND_API_KEY` | Yes | 32 chars | Resend email API key | 180 days | GitHub Secrets |
| `HUGGINGFACE_API_KEY` | No | - | Hugging Face API key for NLLB translations | - | GitHub Secrets |
| `LIBRETRANSLATE_URL` | No | - | LibreTranslate instance URL | - | GitHub Secrets |
| `LIBRETRANSLATE_API_KEY` | No | - | LibreTranslate API key | - | GitHub Secrets |
| `EXCHANGE_RATE_API_KEY` | No | - | Exchange rate API key (if using paid service) | - | GitHub Secrets |

#### Data Storage

| Variable | Required | Min Length | Description | Rotation | Where to Set |
|----------|----------|------------|-------------|----------|--------------|
| `REDIS_URL` | Yes | 10 chars | Redis connection string (e.g., `redis://localhost:6379`) | 365 days | GitHub Secrets |

#### Email Configuration

| Variable | Required | Default | Description | Where to Set |
|----------|----------|---------|-------------|--------------|
| `ADMIN_EMAIL` | No | `desk@warmthly.org` | Admin email for notifications and reports | GitHub Secrets |
| `RESEND_WEBHOOK_SECRET` | No | - | Resend webhook secret for email verification | GitHub Secrets |

#### CORS Configuration

| Variable | Required | Default | Description | Where to Set |
|----------|----------|---------|-------------|--------------|
| `ALLOWED_ORIGINS` | No | `https://www.warmthly.org,https://mint.warmthly.org,https://post.warmthly.org,https://admin.warmthly.org` | Comma-separated list of allowed CORS origins | GitHub Secrets |

#### Compression Configuration

| Variable | Required | Default | Description | Where to Set |
|----------|----------|---------|-------------|--------------|
| `COMPRESSION_LEVEL` | No | `6` | Compression level (1-9, 6 is optimal) | GitHub Secrets |
| `COMPRESSION_THRESHOLD` | No | `1024` | Minimum response size to compress (bytes) | GitHub Secrets |

### Where to Set (Backend)

1. Go to GitHub repository
2. Settings → Secrets and variables → Actions
3. Add each required secret
4. Secrets are automatically injected during deployment

**Note:** For local development, set these environment variables directly in your shell or `.env` file.

## Environment Variable Validation

### Backend Startup Validation

The backend server validates required secrets on startup:

- **Required secrets** must be present or server will exit with error
- **Recommended secrets** will log warnings if missing
- **Secret length** is validated against minimum requirements

See `warmthly-api/utils/validate-secrets.js` for validation logic.

### Frontend Validation

Frontend API functions validate environment variables at runtime:

- Missing required variables return appropriate error responses
- Optional variables gracefully degrade functionality

## Secret Rotation

Secrets should be rotated according to the schedule in the table above:

- **Authentication secrets** (JWT, passwords): 90-180 days
- **API keys**: 180 days
- **Connection strings**: 365 days

### Rotation Process

1. Generate new secret value
2. Update in GitHub Secrets (backend) or Cloudflare Pages (frontend)
3. Deploy new version
4. Verify functionality
5. Revoke old secret (if applicable)

## Security Best Practices

1. **Never commit secrets to git** - Use GitHub Secrets or Cloudflare Pages
2. **Use strong secrets** - Meet minimum length requirements
3. **Rotate regularly** - Follow rotation schedule
4. **Use different secrets per environment** - Separate dev/staging/production
5. **Limit access** - Only grant access to necessary team members
6. **Monitor usage** - Log secret access for audit purposes

## Local Development

For local development, create a `.env` file (not committed to git):

```bash
# Backend (.env in warmthly-api/)
JWT_SECRET=your-local-jwt-secret-min-32-chars
ADMIN_PASSWORD=your-local-admin-password-min-16-chars
YOCO_SECRET_KEY=your-local-yoco-secret-key
REDIS_URL=redis://localhost:6379
# ... other variables
```

**Note:** `.env` files are excluded from git via `.gitignore`.

## Troubleshooting

### Issue: Server won't start
**Solution:** Check that all required secrets are set. Server logs will show missing secrets.

### Issue: API endpoints return 500 errors
**Solution:** Verify environment variables are set correctly in Cloudflare Pages (frontend) or GitHub Secrets (backend).

### Issue: Secrets not updating after deployment
**Solution:** 
- Backend: Verify secrets are set in GitHub Secrets, not just environment variables
- Frontend: Clear Cloudflare Pages cache and redeploy

### Issue: CORS errors
**Solution:** Verify `ALLOWED_ORIGINS` includes your domain, or check default origins in `warmthly-api/server.js`.

## Related Documentation

- `warmthly-api/docs/SECRETS-MANAGEMENT.md` - Secrets management strategy
- `warmthly-api/utils/validate-secrets.js` - Secret validation logic
- `warmthly/api/utils/secrets-management.ts` - Frontend secrets management
- `warmthly/docs/DEPLOYMENT-GUIDE.md` - Deployment instructions

