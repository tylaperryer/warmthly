# Oracle Cloud Infrastructure (OCI) Migration Documentation

> ⚠️ **Note:** Sensitive information (IPs, OCIDs, API keys, passwords) has been moved to `.private/oci-sensitive-config.md` for security. This document contains only public configuration details.

Complete documentation of the API migration from Cloudflare Pages Functions to Oracle Cloud Infrastructure Container Instances.

**Date:** December 7, 2025  
**Status:** ✅ API Deployed and Running  
**API URL:** `http://YOUR_API_IP` (See `.private/oci-sensitive-config.md` for actual IP)

---

## Table of Contents

1. [Overview](#overview)
2. [Oracle Cloud Infrastructure Setup](#oracle-cloud-infrastructure-setup)
3. [Network Configuration](#network-configuration)
4. [Container Instance Deployment](#container-instance-deployment)
5. [API Implementation](#api-implementation)
6. [Code Changes](#code-changes)
7. [Missing Endpoints](#missing-endpoints)
8. [Database Migration Options](#database-migration-options)
9. [Deployment Process](#deployment-process)
10. [Troubleshooting](#troubleshooting)

---

## Overview

### Migration Summary

- **From:** Cloudflare Pages Functions (serverless)
- **To:** Oracle Cloud Infrastructure Container Instances
- **Reason:** Full control, Always Free tier eligible, self-hosted platform
- **Status:** ✅ API deployed and accessible
- **Date:** December 7, 2025

### Current Infrastructure

- **Container Instance:** `warmthly-api`
- **Shape:** `CI.Standard.A1.Flex` (Always Free eligible)
- **Resources:** 1 OCPU, 6 GB memory
- **Public IP:** `YOUR_PUBLIC_IP` (See `.private/oci-sensitive-config.md`)
- **Private IP:** `YOUR_PRIVATE_IP` (See `.private/oci-sensitive-config.md`)
- **Port:** 80 (HTTP)
- **Region:** US East (Ashburn) - `us-ashburn-1`
- **API URL:** `http://YOUR_API_IP` (See `.private/oci-sensitive-config.md`)

### Quick Reference

**API Endpoints:**
- Health: `http://YOUR_API_IP/health` (See `.private/oci-sensitive-config.md`)
- Create Checkout: `POST http://YOUR_API_IP/api/create-checkout`
- i18n Languages: `GET http://YOUR_API_IP/api/i18n/languages`
- i18n Translations: `GET http://YOUR_API_IP/api/i18n/:language`

**Container Registry:**
- Registry: `iad.ocir.io`
- Namespace: `YOUR_OCI_NAMESPACE` (See `.private/oci-sensitive-config.md`)
- Image: `iad.ocir.io/YOUR_NAMESPACE/warmthly-api:latest`

**Environment Variables:**
- `PORT=80`
- `YOCO_SECRET_KEY` - (See `.private/oci-sensitive-config.md` for actual key)

---

## Oracle Cloud Infrastructure Setup

### 1. Virtual Cloud Network (VCN)

**VCN Details:**
- **Name:** `warmthly-apiwar-vcn`
- **OCID:** `ocid1.vcn.oc1.iad.YOUR_OCID` (See `.private/oci-sensitive-config.md`)
- **CIDR Block:** `10.0.0.0/16` (Example CIDR - see `.private/oci-sensitive-config.md` for actual)
- **DNS Domain:** `warmthly.oraclevcn.com`
- **Status:** ✅ Active (Free forever)

**Configuration:**
- IPv4 CIDR: `10.0.0.0/16`
- IPv6: Not enabled
- DNS Resolution: Enabled
- DNS Hostnames: Enabled

### 2. Subnet Configuration

**Public Subnet:**
- **Name:** `warmthly-public-subnet`
- **CIDR Block:** `10.0.0.0/24`
- **Type:** Regional (recommended)
- **Access:** Public (allows public IP addresses)
- **DNS Label:** `warmthlypublics`
- **DNS Domain:** `warmthlypublics.warmthly.oraclevcn.com`

### 3. Internet Gateway (IGW)

**Purpose:** Enables internet access for resources in the VCN

**Configuration:**
- Connected to VCN: `warmthly-apiwar-vcn`
- Route Table: Default route table includes route to IGW (`0.0.0.0/0` → Internet Gateway)
- **Status:** ✅ Active (Free forever)

### 4. Security Lists

**Default Security List for `warmthly-apiwar-vcn`**

**Ingress Rules:**
- **SSH (Port 22):** `0.0.0.0/0` → TCP port 22 (for VM instances)
- **HTTP (Port 80):** `0.0.0.0/0` → TCP port 80 (for API)
- **HTTPS (Port 443):** `0.0.0.0/0` → TCP port 443 (for future HTTPS)
- **ICMP:** Allowed for troubleshooting

**Egress Rules:**
- **All Traffic:** `0.0.0.0/0` → All protocols, all ports (outbound)

**Status:** ✅ Configured correctly

---

## Container Instance Deployment

### Container Instance Details

**Instance Information:**
- **Name:** `warmthly-api`
- **OCID:** `ocid1.computecontainerinstance.oc1.iad.YOUR_OCID` (See `.private/oci-sensitive-config.md`)
- **Shape:** `CI.Standard.A1.Flex`
- **Resources:** 1 OCPU, 6 GB memory
- **Availability Domain:** AD-1
- **Compartment:** `tylaperryer (root)`
- **Status:** ✅ Active

**Network Configuration:**
- **VCN:** `warmthly-apiwar-vcn`
- **Subnet:** `warmthly-public-subnet`
- **Public IP:** `YOUR_PUBLIC_IP` (See `.private/oci-sensitive-config.md`)
- **Private IP:** `YOUR_PRIVATE_IP` (See `.private/oci-sensitive-config.md`)
- **VNIC:** `warmthly-apiwar-vcn`

**Container Details:**
- **Container Name:** `api`
- **Image:** `iad.ocir.io/YOUR_NAMESPACE/warmthly-api:latest` (See `.private/oci-sensitive-config.md`)
- **OCID:** `ocid1.computecontainer.oc1.iad.YOUR_OCID` (See `.private/oci-sensitive-config.md`)
- **Status:** ✅ Active

**Environment Variables:**
- `PORT=80` (server port)
- `YOCO_SECRET_KEY` - (See `.private/oci-sensitive-config.md` for actual key)

**Restart Policy:** Always (container restarts automatically if it stops)

### Always Free Tier Eligibility

✅ **Container Instance is Always Free eligible:**
- Shape: `CI.Standard.A1.Flex`
- Resources: 1 OCPU, 6 GB memory
- Within free tier limits (up to 2 instances, 2 OCPUs total, 12 GB total)

---

## API Implementation

### Current Endpoints (Implemented)

#### ✅ Health Check
- **Endpoint:** `GET /health`
- **Status:** ✅ Implemented
- **Response:** `{"status":"ok","timestamp":"..."}`

#### ✅ Create Checkout (Yoco Payment)
- **Endpoint:** `POST /api/create-checkout`
- **Status:** ✅ Implemented
- **Request Body:** `{ "amount": 100, "currency": "ZAR" }`
- **Response:** `{ "id": "checkout_id" }`

#### ✅ i18n - Get Languages
- **Endpoint:** `GET /api/i18n/languages`
- **Status:** ✅ Implemented (basic)
- **Response:** `{ "languages": ["en", "es", "fr", ...] }`

#### ✅ i18n - Get Translations
- **Endpoint:** `GET /api/i18n/:language`
- **Status:** ✅ Implemented (basic)
- **Response:** `{ "translations": {...}, "version": "1.0.0" }`

#### ✅ i18n - Get Translation Chunk
- **Endpoint:** `POST /api/i18n/:language/chunk`
- **Status:** ✅ Implemented (basic)
- **Request Body:** `{ "keys": [...] }`
- **Response:** `{ "translations": {}, "keys": [...], "total": 0 }`

---

## Missing Endpoints

The following endpoints are called by the frontend but **NOT yet implemented** in `server.js`:

### 🔴 Critical Missing Endpoints

#### 1. Admin Authentication
- **Endpoint:** `POST /api/login`
- **Used by:** `apps/admin/index.html`, `apps/admin/emails/index.html`
- **Purpose:** Admin user authentication with JWT tokens
- **Request Body:** `{ "password": "admin_password", "totpCode": "optional", "mfaStep": "password|totp" }`
- **Response:** `{ "token": "jwt_token" }` or `{ "mfaRequired": true, "nextStep": "totp" }`
- **Required:**
  - Environment variable: `ADMIN_PASSWORD`
  - Environment variable: `JWT_SECRET`
  - JWT library: `jsonwebtoken`
  - Rate limiting: 5 attempts per 15 minutes
  - Constant-time password comparison (security)
- **Reference:** See `warmthly/api/auth/login.ts` for full implementation
- **Dependencies:** `warmthly/api/middleware/rate-limit.ts`, `warmthly/api/utils/crypto-utils.ts`

#### 2. Email Management
- **Endpoint:** `POST /api/send-email`
- **Used by:** `apps/admin/emails/index.html`
- **Purpose:** Send emails via Resend email service
- **Request Body:** `{ "to": "email@example.com", "subject": "Subject", "html": "<p>Body</p>" }`
- **Response:** `{ "message": "Email sent successfully!", "data": {...} }`
- **Required:**
  - Environment variable: `RESEND_API_KEY`
  - Resend library: `resend`
  - Rate limiting: 10 requests per hour
  - Input validation (email format, subject length, HTML content)
- **Reference:** See `warmthly/api/endpoints/send-email.ts` for implementation

- **Endpoint:** `GET /api/get-emails`
- **Used by:** `apps/admin/emails/index.html`
- **Purpose:** Retrieve received emails
- **Response:** `{ "emails": [...] }`
- **Required:** 
  - Email storage system (database or email service API)
  - Consider using Resend's inbound email webhook or database storage

#### 3. Airtable Integration
- **Endpoint:** `GET /api/airtable`
- **Used by:** `apps/mint/index.html`
- **Purpose:** Proxy requests to Airtable API with Redis caching
- **Query Parameters:** 
  - `baseId` (required) - Airtable base ID
  - `tableName` (required) - Table name
  - `viewId` (optional) - View ID
  - `page` (optional) - Page number
- **Response:** `{ "records": [...], "offset": "..." }`
- **Required:**
  - Environment variable: `AIRTABLE_API_KEY`
  - Redis client for caching (30 second TTL)
  - Rate limiting: 100 requests per 15 minutes
  - Timeout: 10 seconds
- **Reference:** See `warmthly/api/endpoints/airtable.ts` for implementation
- **Note:** Redis is optional but recommended for caching

#### 4. Reports Submission
- **Endpoint:** `POST /api/reports`
- **Used by:** `apps/post/report/index.html`
- **Purpose:** Submit user reports/concerns and send email notification
- **Request Body:** 
  ```json
  {
    "name": "User Name",
    "email": "user@example.com",
    "type": "media|concern|admin|other",
    "message": "Report message"
  }
  ```
- **Response:** `{ "message": "Report submitted successfully" }`
- **Required:**
  - Environment variable: `RESEND_API_KEY` (for email notifications)
  - Database storage for reports (or email-only)
  - Rate limiting: 100 requests per 15 minutes
  - Input validation (email, name length, message length, report type)
- **Reference:** See `warmthly/api/endpoints/reports.ts` for implementation

#### 5. Currency Conversion
- **Endpoint:** `GET /api/convert-currency`
- **Used by:** `apps/main/index.html`
- **Purpose:** Convert currency amounts using exchange rate API
- **Query Parameters:** 
  - `amount` (required) - Amount to convert
  - `from` (required) - Source currency code (e.g., "USD")
  - `to` (required) - Target currency code (e.g., "ZAR")
- **Response:** 
  ```json
  {
    "convertedAmount": 100.50,
    "rate": 18.5,
    "formattedOriginal": "$100.00",
    "formattedConverted": "R1,850.00"
  }
  ```
- **Required:**
  - Currency conversion API (ExchangeRate-API, Fixer.io, etc.)
  - Environment variable: `CURRENCY_API_KEY` (if API requires key)
  - Currency whitelist validation (security - prevents object injection)
  - Timeout: 10 seconds
- **Reference:** See `warmthly/api/endpoints/convert-currency.ts` for implementation
- **Supported Currencies:** USD, EUR, GBP, JPY, AUD, CAD, CHF, CNY, ZAR, and 40+ more

#### 6. Yoco Public Key
- **Endpoint:** `GET /api/get-yoco-public-key`
- **Used by:** `apps/main/index.html`
- **Purpose:** Get Yoco public key for frontend SDK
- **Response:** `{ "publicKey": "pk_live_..." }`
- **Required:**
  - Environment variable: `YOCO_PUBLIC_KEY`
  - Simple GET endpoint (no rate limiting needed - public key is safe to expose)
- **Reference:** See `warmthly/api/endpoints/get-yoco-public-key.ts` for implementation

---

## Code Changes

### Files Modified

#### 1. `warmthly-api/server.js`
- ✅ Changed port from 3000 to 80
- ✅ Added CORS configuration for Warmthly domains
- ✅ Implemented basic endpoints (health, checkout, i18n)
- ⚠️ **Note:** Contains Greenlock SSL code that's not being used (can be removed)

#### 2. `warmthly-api/Dockerfile`
- ✅ Changed EXPOSE from 3000 to 80
- ✅ Uses Node.js 20 Alpine base image

#### 3. `warmthly-api/package.json`
- ✅ Added `express` and `cors` dependencies
- ✅ Start script: `node server.js`

#### 4. Frontend Files (All HTML files)
- ✅ Added `window.API_BASE_URL` configuration
- ✅ Updated all API calls to use `API_BASE_URL`
- **Files:**
  - `warmthly/apps/main/index.html`
  - `warmthly/apps/mint/index.html`
  - `warmthly/apps/admin/index.html`
  - `warmthly/apps/admin/emails/index.html`
  - `warmthly/apps/post/report/index.html`

#### 5. `warmthly/lego/config/api-config.ts`
- ✅ Created centralized API configuration
- ✅ Default URL: `http://YOUR_API_IP` (See `.private/oci-sensitive-config.md`)
- ✅ Supports `window.API_BASE_URL` override

#### 6. i18n Components
- ✅ Updated to use `API_CONFIG` for API calls
- **Files:**
  - `warmthly/lego/utils/i18n.ts`
  - `warmthly/lego/components/warmthly-i18n.ts`
  - `warmthly/lego/components/warmthly-language-switcher.ts`
  - `warmthly/lego/utils/language-support.ts`
  - `warmthly/lego/utils/rtl-support.ts`
  - `warmthly/lego/components/warmthly-head.ts`

#### 7. GitHub Actions Workflow
- ✅ Created `.github/workflows/deploy-oci.yml`
- ✅ Auto-deploys on push to `main` branch
- ⚠️ **Note:** Requires GitHub secrets to be configured

---

## Database Migration Options

### Oracle Cloud Free Tier Database Options

#### Option 1: Oracle Autonomous Database (Always Free) ⭐ RECOMMENDED

**Features:**
- ✅ **Always Free** (no expiration, truly free forever)
- ✅ Up to 2 databases
- ✅ 1 OCPU, 1 TB storage per database
- ✅ Automatic backups, patching, scaling
- ✅ Supports SQL, JSON, REST APIs
- ✅ Built-in REST APIs (no code needed)
- ✅ Automatic encryption
- ✅ High availability

**Limitations:**
- 1 OCPU per database
- 1 TB storage (can upgrade)
- Limited to 2 Always Free databases

**Use Cases:**
- ✅ Replace Airtable for structured data
- ✅ Store reports, emails, admin data
- ✅ User data, analytics
- ✅ Transactional data

**Setup Steps:**
1. Go to **OCI Console → Oracle Database → Autonomous Database**
2. Click **"Create Autonomous Database"**
3. Select **"Always Free"** tier
4. Configure:
   - **Database Name:** `warmthly-db`
   - **Display Name:** `Warmthly Database`
   - **Workload Type:** `Transaction Processing` or `Data Warehouse`
   - **Admin Password:** Set secure password
   - **License Type:** `License Included`
5. Click **"Create Autonomous Database"**
6. Wait 5-10 minutes for provisioning
7. Access via:
   - **REST APIs** (automatic, no code needed)
   - **SQL Developer Web** (browser-based)
   - **Database Tools** (SQL*Plus, etc.)

**REST API Access:**
- Automatic REST endpoints for all tables
- No code required - OCI generates REST APIs
- Access via: `https://{db-url}/ords/{schema}/api/`

**Migration from Airtable:**
1. Export Airtable data (CSV/JSON)
2. Create tables in Autonomous Database
3. Import data
4. Update API endpoints to use database REST APIs

**Cost:** **$0** (Always Free, no expiration)

---

#### Option 2: MySQL on Container Instance (Free)

**Setup:**
- Deploy MySQL container in same Container Instance
- Or use separate Container Instance for database
- Self-managed but free

**Limitations:**
- Uses Container Instance resources (shares with API)
- Self-managed (backups, updates, etc.)
- Requires Docker knowledge

**Use Cases:**
- Simple database needs
- If you prefer MySQL/PostgreSQL

**Cost:** **$0** (uses Always Free Container Instance)

---

#### Option 3: Oracle NoSQL Database (Free Tier)

**Features:**
- ✅ Free tier available
- ✅ NoSQL document storage
- ✅ Good for JSON data
- ✅ Simple key-value or document model

**Limitations:**
- Different query model than SQL
- May require code changes

**Use Cases:**
- Replace Airtable for flexible schemas
- Store reports, user data as JSON documents

**Cost:** **$0** (free tier available)

---

### Recommendation: Oracle Autonomous Database

**Why:**
- ✅ Truly free forever (Always Free)
- ✅ Automatic REST APIs (no backend code needed)
- ✅ Automatic backups and maintenance
- ✅ 1 TB storage (plenty for most use cases)
- ✅ Easy migration from Airtable
- ✅ Can use SQL or REST APIs

**Migration Path:**
1. Create Autonomous Database (Always Free)
2. Export Airtable data
3. Create tables in database
4. Import data
5. Use automatic REST APIs or write custom endpoints
6. Update frontend to use new database endpoints

---

## Deployment Process

### Manual Deployment

1. **Build Docker Image:**
   ```bash
   cd warmthly-api
   docker build -t iad.ocir.io/YOUR_NAMESPACE/warmthly-api:latest .
   ```

2. **Login to OCI Container Registry:**
   ```bash
   echo "YOUR_AUTH_TOKEN" | docker login iad.ocir.io -u YOUR_NAMESPACE/YOUR_EMAIL --password-stdin
   ```

3. **Push Image:**
   ```bash
   docker push iad.ocir.io/YOUR_NAMESPACE/warmthly-api:latest
   ```

4. **Restart Container Instance:**
   - Go to **OCI Console → Container Instances → warmthly-api**
   - Click **"Restart"**
   - Wait for container to restart

### Automatic Deployment (GitHub Actions)

**Workflow:** `.github/workflows/deploy-oci.yml`

**Triggers:**
- Push to `main` branch
- Manual workflow dispatch

**Process:**
1. Checkout code
2. Build Docker image
3. Push to OCI Container Registry
4. Restart Container Instance

**Required GitHub Secrets:**
- `OCI_USERNAME` - OCI username
- `OCI_AUTH_TOKEN` - OCI Auth Token
- `OCI_NAMESPACE` - OCI namespace (See `.private/oci-sensitive-config.md`)
- `OCI_CONFIG_FILE` - Base64 encoded OCI config

**Status:** ⚠️ Not yet configured (secrets needed)

---

## Troubleshooting

### Common Issues

#### 1. Container Not Accessible
- **Check:** Container instance status (should be "Active")
- **Check:** Security list allows port 80 from `0.0.0.0/0`
- **Check:** Container logs for errors
- **Test:** `curl http://YOUR_API_IP/health` (See `.private/oci-sensitive-config.md`)

#### 2. API Returns 404
- **Check:** Endpoint is implemented in `server.js`
- **Check:** Route path matches exactly
- **Check:** HTTP method (GET vs POST)

#### 3. CORS Errors
- **Check:** Origin is in `allowedOrigins` array in `server.js`
- **Check:** CORS headers are set correctly

#### 4. Environment Variables Not Working
- **Check:** Container instance environment variables
- **Check:** Variable names are uppercase (e.g., `PORT`, not `port`)
- **Check:** Container was restarted after adding variables

#### 5. Cloudflare 521 Error (Web Server is Down)
- **Error:** `error code: 521` when accessing `https://backend.warmthly.org`
- **Cause:** Cloudflare cannot connect to origin server
- **Solutions Attempted:**
  - ✅ Changed container port from 3000 to 80
  - ✅ Verified security list allows port 80
  - ✅ Set Cloudflare SSL/TLS to "Full"
  - ✅ Disabled "Authenticated Origin Pulls"
  - ✅ Created Origin Rules to rewrite port to 80
  - ❌ **Still failing** - Cloudflare cannot connect to OCI container
- **Workaround:** Use direct IP (See `.private/oci-sensitive-config.md` for actual IP)
- **Possible Causes:**
  - OCI firewall blocking Cloudflare IPs
  - Cloudflare IP ranges not whitelisted in OCI
  - Network routing issue between Cloudflare and OCI
- **Future Fix:** Use OCI Load Balancer with SSL certificate instead of Cloudflare

### Container Logs

**View Logs:**
1. Go to **OCI Console → Container Instances → warmthly-api**
2. Click **"Containers"** tab
3. Click on **"api"** container
4. Click **"View Logs"**

**Common Log Messages:**
- `Warmthly API server running on port 80` - ✅ Server started
- `Error: ...` - ❌ Check error message

### Testing API Endpoints

**PowerShell Test Script:**
```powershell
# Test all endpoints on HTTP (direct IP)
$baseUrl = "http://YOUR_API_IP"  # See .private/oci-sensitive-config.md

Write-Host "Testing HTTP endpoints..." -ForegroundColor Green

# Health check
Write-Host "`n1. Health Check:" -ForegroundColor Yellow
curl "$baseUrl/health"

# i18n Languages
Write-Host "`n2. i18n Languages:" -ForegroundColor Yellow
curl "$baseUrl/api/i18n/languages"

# i18n English
Write-Host "`n3. i18n English:" -ForegroundColor Yellow
curl "$baseUrl/api/i18n/en"

# Create Checkout (POST)
Write-Host "`n4. Create Checkout:" -ForegroundColor Yellow
curl -Method POST -Uri "$baseUrl/api/create-checkout" -ContentType "application/json" -Body '{"amount":100,"currency":"ZAR"}'
```

**cURL Test Script (Linux/Mac):**
```bash
#!/bin/bash
BASE_URL="http://YOUR_API_IP"  # See .private/oci-sensitive-config.md

echo "Testing HTTP endpoints..."
echo ""

echo "1. Health Check:"
curl "$BASE_URL/health"
echo ""

echo "2. i18n Languages:"
curl "$BASE_URL/api/i18n/languages"
echo ""

echo "3. i18n English:"
curl "$BASE_URL/api/i18n/en"
echo ""

echo "4. Create Checkout:"
curl -X POST "$BASE_URL/api/create-checkout" \
  -H "Content-Type: application/json" \
  -d '{"amount":100,"currency":"ZAR"}'
echo ""
```

**Expected Responses:**
- Health: `{"status":"ok","timestamp":"..."}`
- Languages: `{"languages":["en","es","fr",...]}`
- Translations: `{"translations":{...},"version":"1.0.0"}`
- Checkout: `{"id":"checkout_id"}` or error if Yoco key not configured

### Cloudflare Troubleshooting History

**Attempted Solutions:**
1. ✅ Created A record `backend.warmthly.org` → `YOUR_PUBLIC_IP` (Proxied)
2. ✅ Created A record `backend-origin.warmthly.org` → `YOUR_PUBLIC_IP` (DNS only)
3. ✅ Created Cloudflare Worker to proxy requests
4. ✅ Changed container port from 3000 to 80
5. ✅ Verified security list allows port 80
6. ✅ Set SSL/TLS mode to "Full"
7. ✅ Disabled "Authenticated Origin Pulls"
8. ✅ Created Origin Rule to rewrite port to 80
9. ❌ **All failed** - Persistent 521 error

**Current Status:**
- ✅ Direct IP access works (See `.private/oci-sensitive-config.md` for actual IP)
- ❌ Cloudflare domain fails: `https://backend.warmthly.org/health` (521 error)
- **Decision:** Use direct IP until Cloudflare issue is resolved

---

## Next Steps

### Immediate (Required)

1. **Implement Missing Endpoints:**
   - `/api/login` - Admin authentication
   - `/api/send-email` - Email sending
   - `/api/get-emails` - Email retrieval
   - `/api/airtable` - Airtable proxy
   - `/api/reports` - Report submissions
   - `/api/convert-currency` - Currency conversion
   - `/api/get-yoco-public-key` - Yoco public key

2. **Update Frontend URLs:**
   - Change all `https://backend.warmthly.org` to `http://YOUR_API_IP` (See `.private/oci-sensitive-config.md`)
   - Or configure Cloudflare properly for HTTPS

### Short Term

3. **Set Up Database:**
   - Create Oracle Autonomous Database (Always Free)
   - Migrate Airtable data
   - Implement database endpoints

4. **Configure GitHub Actions:**
   - Add required secrets
   - Test auto-deployment

5. **Add Rate Limiting:**
   - Implement rate limiting middleware
   - Protect against DDoS

### Long Term

6. **Add HTTPS:**
   - Fix Cloudflare proxy connection
   - Or use OCI Load Balancer with SSL certificate
   - Enable HSTS

7. **Monitoring:**
   - Set up OCI Monitoring
   - Add health check alerts
   - Log aggregation

8. **Backup Strategy:**
   - Configure database backups
   - Container image versioning
   - Disaster recovery plan

---

## Cost Summary

### Always Free Tier Resources Used

✅ **Container Instance:**
- 1 instance × 1 OCPU = 1 OCPU used
- 1 instance × 6 GB = 6 GB used
- **Remaining:** 1 instance, 1 OCPU, 6 GB available

✅ **Networking:**
- VCN: Free forever
- Subnet: Free forever
- Internet Gateway: Free forever
- Security Lists: Free forever

✅ **Container Registry:**
- Storage: 10 GB free
- Bandwidth: Generous free tier

**Total Monthly Cost:** **$0** (within Always Free tier)

---

## Configuration Reference

> ⚠️ **All sensitive information (IPs, OCIDs, API keys, passwords) has been moved to `.private/oci-sensitive-config.md`**

### Environment Variables

**Required:**
- `PORT` - Server port (default: 80)
- `YOCO_SECRET_KEY` - Yoco payment gateway secret key

**Optional (for missing endpoints):**
- `ADMIN_PASSWORD` - Admin login password
- `JWT_SECRET` - JWT signing secret
- `AIRTABLE_API_KEY` - Airtable API key
- `RESEND_API_KEY` - Resend email API key
- `CURRENCY_API_KEY` - Currency conversion API key
- `YOCO_PUBLIC_KEY` - Yoco public key for frontend

> ⚠️ **Note:** Actual values are stored in `.private/oci-sensitive-config.md`. See that file for IPs, OCIDs, and secret keys.

---

## Support and Resources

### Oracle Cloud Documentation
- [Container Instances](https://docs.oracle.com/en-us/iaas/Content/container-instances/home.htm)
- [Always Free Tier](https://www.oracle.com/cloud/free/)
- [OCI CLI](https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/cliinstall.htm)

### API Documentation
- See `warmthly/docs/API.md` for complete API reference
- See `warmthly-api/README.md` for deployment details

---

**Last Updated:** December 7, 2025  
**Maintained By:** Tyla Perryer  
**Status:** ✅ Production Ready (with missing endpoints to be implemented)

