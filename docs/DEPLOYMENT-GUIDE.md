# Warmthly Deployment Guide

Complete deployment guide for both the Warmthly API (OCI) and frontend applications (Cloudflare Pages).

## Table of Contents

1. [API Configuration](#api-configuration)
2. [Frontend Deployment](#frontend-deployment)
3. [API Deployment (OCI)](#api-deployment-oci)
4. [Prerequisites](#prerequisites)
5. [OCI Setup](#oci-setup)
6. [Container Registry Setup](#container-registry-setup)
7. [Container Instance Creation](#container-instance-creation)
8. [Network Configuration](#network-configuration)
9. [Environment Variables](#environment-variables)
10. [Deployment Methods](#deployment-methods)
11. [Verification](#verification)
12. [Troubleshooting](#troubleshooting)

---

## API Configuration

The API is deployed on OCI Container Instance and accessible via HTTPS at: `https://backend.warmthly.org`

### Frontend Configuration

All frontend applications are configured to use the OCI API through the centralized API config:

1. **API Config File**: `warmthly/lego/config/api-config.ts`
   - Centralized API base URL management
   - Supports environment-based configuration
   - Defaults to OCI Container Instance URL

2. **HTML Files**: All HTML files include API config initialization:

   ```html
   <script>
     window.API_BASE_URL = 'https://backend.warmthly.org';
   </script>
   ```

3. **Updated Components**:
   - `warmthly/lego/utils/i18n.ts` - Uses API_CONFIG for i18n endpoints
   - `warmthly/lego/components/warmthly-i18n.ts` - Uses API_CONFIG
   - `warmthly/lego/components/warmthly-language-switcher.ts` - Uses API_CONFIG
   - `warmthly/lego/utils/language-support.ts` - Uses API_CONFIG
   - `warmthly/lego/utils/rtl-support.ts` - Uses API_CONFIG
   - `warmthly/lego/components/warmthly-head.ts` - Uses API_CONFIG

### Changing API URL

To change the API URL, update one of these:

1. **In HTML files** (quick change):

   ```html
   <script>
     window.API_BASE_URL = 'YOUR_NEW_API_URL';
   </script>
   ```

2. **In API config** (permanent change):
   Edit `warmthly/lego/config/api-config.ts`:
   ```typescript
   return 'YOUR_NEW_API_URL';
   ```

## Frontend Deployment

### Auto-Deployment via GitHub Actions

**Everything runs automatically!** When you push code to GitHub:

- ✅ Tests run automatically
- ✅ Code is checked automatically
- ✅ Builds happen automatically
- ✅ Deployment happens automatically

**You don't need to do anything locally.** Just push your code!

The frontend deployment workflow:

1. Runs CI checks (tests, linting, type checking)
2. Builds all applications in parallel
3. Copies API functions to each site
4. Deploys pre-built static files to Cloudflare Pages

**Deployment Architecture:**

- Each site deploys to its own Cloudflare Pages project:
  - `build/main` → `warmthly` project → `www.warmthly.org`
  - `build/mint` → `warmthly-mint` project → `mint.warmthly.org`
  - `build/post` → `warmthly-post` project → `post.warmthly.org`
  - `build/admin` → `warmthly-admin` project → `admin.warmthly.org`

**Important:** Ensure Cloudflare Pages build settings are disabled for all projects:

- Go to each Cloudflare Pages project (warmthly, warmthly-mint, warmthly-post, warmthly-admin)
- Settings → Builds & deployments
- Set "Build command" to empty/blank
- Set "Build output directory" to `/` (root)

## API Deployment (OCI)

Complete step-by-step guide for deploying the Warmthly API to Oracle Cloud Infrastructure (OCI).

### Auto-Deployment

#### GitHub Actions Workflow

Automatic deployment is set up via GitHub Actions:

- **Workflow File**: `warmthly-api/.github/workflows/deploy-oci.yml`
- **Triggers**:
  - Push to `main` branch
  - Manual workflow dispatch

#### Setup Required

1. **GitHub Secrets** (Settings → Secrets and variables → Actions):
   - `OCI_USERNAME` - Your OCI username
   - `OCI_AUTH_TOKEN` - OCI Auth Token
   - `OCI_NAMESPACE` - OCI namespace (e.g., `id1oqczh26jb`)
   - `OCI_CONFIG_FILE` - Base64 encoded OCI config file

2. **Get OCI Config File**:

   ```bash
   # In Cloud Shell
   cat ~/.oci/config | base64 -w 0
   ```

3. **Update Container Instance OCID**:
   Edit `.github/workflows/deploy-oci.yml`:
   ```yaml
   CONTAINER_INSTANCE_OCID: ocid1.computecontainerinstance.oc1.iad.anuwcljsh5fku5iazzbkf65frmxqcenlovxlfau6blbjsp5fgmumcxmssksa
   ```

#### How It Works

1. Push code to GitHub
2. GitHub Actions builds Docker image
3. Pushes to OCI Container Registry
4. Updates Container Instance with new image
5. Restarts Container Instance
6. Done! ✅

### Manual Deployment

If you need to deploy manually:

```bash
# In Cloud Shell
cd warmthly-api
git pull
docker build -t us-ashburn-1.ocir.io/id1oqczh26jb/warmthly-api:latest .
docker push us-ashburn-1.ocir.io/id1oqczh26jb/warmthly-api:latest

# Then restart container instance in OCI Console
```

### Testing

#### Health Check

```bash
curl https://backend.warmthly.org/health
```

#### i18n Endpoints

```bash
# Get languages
curl https://backend.warmthly.org/api/i18n/languages

# Get translations
curl https://backend.warmthly.org/api/i18n/en
```

#### Checkout Endpoint

```bash
curl -X POST https://backend.warmthly.org/api/create-checkout \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "currency": "ZAR"}'
```

---

## API Deployment (OCI) - Detailed Setup

---

## Prerequisites

### Required Accounts & Tools

- **Oracle Cloud Account** (Free tier eligible)
- **OCI CLI** installed and configured
- **Docker** installed locally
- **Git** for cloning the repository
- **GitHub Account** (for CI/CD)

### OCI Resources Needed

- Container Registry (Always Free)
- Container Instance (Always Free eligible)
- VCN (Virtual Cloud Network) with Internet Gateway
- Security Lists configured

---

## OCI Setup

### 1. Create Compartment

```bash
# Using OCI CLI
oci iam compartment create \
  --compartment-id <tenancy-ocid> \
  --name warmthly-api \
  --description "Warmthly API resources"
```

Or use the OCI Console:

1. Navigate to **Identity & Security** > **Compartments**
2. Click **Create Compartment**
3. Name: `warmthly-api`
4. Click **Create**

### 2. Create VCN (if not exists)

```bash
# Create VCN
oci network vcn create \
  --compartment-id <compartment-ocid> \
  --cidr-block "10.0.0.0/16" \
  --display-name warmthly-vcn
```

Or use OCI Console:

1. Navigate to **Networking** > **Virtual Cloud Networks**
2. Click **Create VCN**
3. Configure:
   - Name: `warmthly-vcn`
   - CIDR: `10.0.0.0/16`
   - Compartment: `warmthly-api`
4. Click **Create VCN**

### 3. Create Internet Gateway

```bash
# Create Internet Gateway
oci network internet-gateway create \
  --compartment-id <compartment-ocid> \
  --vcn-id <vcn-ocid> \
  --display-name warmthly-igw \
  --is-enabled true
```

Or use OCI Console:

1. In your VCN, click **Internet Gateways**
2. Click **Create Internet Gateway**
3. Name: `warmthly-igw`
4. Click **Create**

### 4. Update Route Table

1. In your VCN, click **Route Tables**
2. Click on the default route table
3. Click **Add Route Rules**
4. Add:
   - Target Type: `Internet Gateway`
   - Destination CIDR: `0.0.0.0/0`
   - Target: `warmthly-igw`
5. Click **Add Route Rules**

---

## Container Registry Setup

### 1. Create Container Registry

```bash
# Create registry
oci artifacts container repository create \
  --compartment-id <compartment-ocid> \
  --display-name warmthly-api \
  --is-public false
```

Or use OCI Console:

1. Navigate to **Developer Services** > **Container Registry**
2. Click **Create Repository**
3. Configure:
   - Name: `warmthly-api`
   - Access: `Private`
   - Compartment: `warmthly-api`
4. Click **Create**

### 2. Get Registry Login Command

```bash
# Get login command
oci artifacts container image list \
  --compartment-id <compartment-ocid> \
  --repository-name warmthly-api
```

Or use OCI Console:

1. Click on your repository
2. Click **Copy Login Command**
3. Run the command in your terminal

---

## Container Instance Creation

### 1. Build Docker Image

```bash
cd warmthly-api
docker build -t warmthly-api:latest .
```

### 2. Tag Image for OCI Registry

```bash
# Get your registry endpoint (format: <region>.ocir.io/<tenancy-namespace>/warmthly-api)
docker tag warmthly-api:latest <region>.ocir.io/<tenancy-namespace>/warmthly-api:latest
```

### 3. Push Image to Registry

```bash
# Login to OCI registry (use command from step 2.2)
docker push <region>.ocir.io/<tenancy-namespace>/warmthly-api:latest
```

### 4. Create Container Instance

**Using OCI Console:**

1. Navigate to **Developer Services** > **Container Instances**
2. Click **Create Container Instance**
3. Configure:

   **Basic Information:**
   - Name: `warmthly-api`
   - Compartment: `warmthly-api`
   - Availability Domain: Select one
   - Shape: `CI.Standard.A1.Flex` (Always Free eligible)
   - OCPUs: `1`
   - Memory: `6 GB`

   **Networking:**
   - VCN: `warmthly-vcn`
   - Subnet: Select public subnet
   - Assign Public IP: `Yes`

   **Container Configuration:**
   - Image: `<region>.ocir.io/<tenancy-namespace>/warmthly-api:latest`
   - Container Name: `api`
   - Port: `80`

   **Environment Variables:**
   - Add all required environment variables (see [Environment Variables](#environment-variables))

4. Click **Create**

**Using OCI CLI:**

```bash
oci container-instances container-instance create \
  --compartment-id <compartment-ocid> \
  --display-name warmthly-api \
  --availability-domain <ad-name> \
  --shape CI.Standard.A1.Flex \
  --shape-config '{"ocpus": 1, "memoryInGBs": 6}' \
  --vnics '[{
    "subnetId": "<subnet-ocid>",
    "assignPublicIp": true
  }]' \
  --containers '[{
    "displayName": "api",
    "imageUrl": "<region>.ocir.io/<tenancy-namespace>/warmthly-api:latest",
    "environmentVariables": {
      "PORT": "80",
      "NODE_ENV": "production"
    }
  }]'
```

---

## Network Configuration

### 1. Security List Rules

Configure security list to allow HTTP/HTTPS traffic:

**Ingress Rules:**

- Source: `0.0.0.0/0`
- IP Protocol: `TCP`
- Destination Port: `80` (HTTP)
- Destination Port: `443` (HTTPS)

**Using OCI Console:**

1. Navigate to your VCN
2. Click **Security Lists**
3. Click on default security list
4. Click **Add Ingress Rules**
5. Add rules for ports 80 and 443

### 2. Load Balancer (Optional)

For production, consider using OCI Load Balancer:

1. Navigate to **Networking** > **Load Balancers**
2. Click **Create Load Balancer**
3. Configure:
   - Name: `warmthly-api-lb`
   - Type: `Public`
   - Shape: `Flexible`
   - Backend: Your Container Instance
   - Listener: Port 80/443

---

## Environment Variables

### Required Variables

Set these in your Container Instance configuration:

```bash
# Server Configuration
PORT=80
NODE_ENV=production

# SSL/TLS (if using Greenlock)
USE_GREENLOCK=false  # Set to true if not using load balancer SSL
LE_EMAIL=your-email@example.com  # Required if USE_GREENLOCK=true
LE_STAGING=false  # Set to true for testing

# API Keys (injected via GitHub Secrets in CI/CD)
ADMIN_PASSWORD=<your-admin-password>
JWT_SECRET=<your-jwt-secret>
RESEND_API_KEY=<your-resend-key>
AIRTABLE_API_KEY=<your-airtable-key>
EXCHANGE_RATE_API_KEY=<your-exchange-rate-key>
YOCO_SECRET_KEY=<your-yoco-secret-key>
YOCO_PUBLIC_KEY=<your-yoco-public-key>
REDIS_URL=<your-redis-url>  # Optional but recommended
ADMIN_EMAIL=<admin-email@example.com>
```

### Setting Environment Variables

**Using OCI Console:**

1. Navigate to your Container Instance
2. Click **Edit**
3. Scroll to **Container Configuration**
4. Add environment variables under **Environment Variables**
5. Click **Save Changes**

**Using OCI CLI:**

```bash
oci container-instances container-instance update \
  --container-instance-id <instance-ocid> \
  --containers '[{
    "displayName": "api",
    "imageUrl": "<image-url>",
    "environmentVariables": {
      "PORT": "80",
      "NODE_ENV": "production",
      "ADMIN_PASSWORD": "<password>"
      # ... add all variables
    }
  }]'
```

---

## Deployment Methods

### Method 1: Manual Deployment

1. Build and push Docker image (see steps above)
2. Update Container Instance with new image
3. Restart Container Instance

### Method 2: GitHub Actions CI/CD (Recommended)

The repository includes GitHub Actions workflows for automatic deployment:

1. **Configure GitHub Secrets:**
   - `OCI_USER_OCID`
   - `OCI_TENANCY_OCID`
   - `OCI_REGION`
   - `OCI_FINGERPRINT`
   - `OCI_PRIVATE_KEY`
   - `OCI_COMPARTMENT_OCID`
   - `OCI_CONTAINER_INSTANCE_OCID`
   - All API keys and secrets

2. **Push to main branch:**

   ```bash
   git push origin main
   ```

3. **GitHub Actions will:**
   - Build Docker image
   - Push to OCI Container Registry
   - Update Container Instance
   - Restart container

### Method 3: OCI Resource Manager

1. Create Terraform stack
2. Define Container Instance resource
3. Apply stack for updates

---

## Verification

### 1. Check Container Instance Status

```bash
oci container-instances container-instance get \
  --container-instance-id <instance-ocid>
```

Or use OCI Console to verify status is **Running**.

### 2. Test Health Endpoint

```bash
# Get public IP from Container Instance
curl http://<public-ip>/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2025-01-XX...",
  "uptime": 123.45,
  "version": "1.0.0",
  "redis": {
    "status": "connected"
  }
}
```

### 3. Test API Endpoint

```bash
curl http://<public-ip>/api/get-yoco-public-key
```

### 4. Check Logs

**Using OCI Console:**

1. Navigate to Container Instance
2. Click **Logs**
3. View container logs

**Using OCI CLI:**

```bash
oci logging log-content get \
  --log-id <log-ocid> \
  --time-start <start-time>
```

---

## Troubleshooting

### Container Won't Start

1. **Check logs:**
   - View container logs in OCI Console
   - Look for error messages
   - Common errors: missing environment variables, port conflicts

2. **Verify environment variables:**
   - Ensure all required variables are set
   - Check for typos in variable names
   - Verify values are correct (no extra spaces, correct format)

3. **Check resource limits:**
   - Verify OCPU and memory are sufficient
   - Check if Always Free limits are exceeded
   - Minimum: 1 OCPU, 1GB RAM

4. **Check container image:**
   - Verify image exists in Container Registry
   - Check image tag is correct
   - Ensure image is accessible

### API Not Accessible

1. **Check security list:**
   - Verify ingress rules allow ports 80/443
   - Source should be `0.0.0.0/0` for public access
   - Check egress rules allow outbound connections

2. **Verify public IP:**
   - Ensure Container Instance has public IP assigned
   - Check if IP is correct
   - Verify IP is not blocked by firewall

3. **Test connectivity:**

   ```bash
   # Test health endpoint
   curl -v http://<public-ip>/health

   # Test API endpoint
   curl -v http://<public-ip>/api/get-yoco-public-key
   ```

4. **Check route table:**
   - Verify route table has Internet Gateway route
   - Check default route (0.0.0.0/0 → Internet Gateway)

### Redis Connection Issues

1. **Check REDIS_URL:**
   - Verify Redis URL is correct format: `redis://host:port` or `rediss://host:port`
   - Test connection from local machine
   - Check if Redis requires authentication

2. **Check Redis security:**
   - Ensure Redis allows connections from Container Instance IP
   - Verify firewall rules
   - Check Redis security groups/network ACLs

3. **Test Redis connection:**
   ```bash
   # From Container Instance
   redis-cli -h <redis-host> -p <redis-port> ping
   ```

### SSL/HTTPS Issues

1. **If using Greenlock:**
   - Verify `LE_EMAIL` is set
   - Check `USE_GREENLOCK=true`
   - Review Let's Encrypt logs
   - Ensure port 80 is accessible for ACME challenge

2. **If using Load Balancer:**
   - Verify SSL certificate is configured
   - Check listener configuration
   - Verify certificate is valid and not expired

### Performance Issues

1. **Check resource usage:**
   - Monitor OCPU and memory usage
   - Scale up if consistently above 80%

2. **Check application logs:**
   - Look for slow queries
   - Check for memory leaks
   - Review error rates

3. **Check network:**
   - Verify network latency
   - Check bandwidth usage
   - Review connection pool settings

## Rollback Procedures

### Rollback to Previous Container Image

1. **Identify previous image tag:**

   ```bash
   # List available images
   oci artifacts container image list \
     --compartment-id <compartment-ocid> \
     --repository-id <repository-ocid>
   ```

2. **Update Container Instance:**

   ```bash
   # Update to previous image
   oci compute-container-instance update \
     --container-instance-id <instance-ocid> \
     --containers '[{
       "imageUrl": "iad.ocir.io/<namespace>/warmthly-api:<previous-tag>",
       "displayName": "warmthly-api"
     }]'
   ```

3. **Verify rollback:**
   ```bash
   curl http://<public-ip>/health
   ```

### Rollback via GitHub Actions

If deployment is automated via GitHub Actions:

1. **Revert code:**

   ```bash
   git revert <commit-hash>
   git push origin main
   ```

2. **Wait for deployment:**
   - GitHub Actions will automatically deploy previous version
   - Monitor deployment status in GitHub Actions

3. **Verify rollback:**
   - Check health endpoint
   - Test critical functionality
   - Monitor error logs

### Emergency Rollback Checklist

- [ ] Identify issue severity (critical/non-critical)
- [ ] Determine rollback target (previous version/tag)
- [ ] Backup current state (logs, database if applicable)
- [ ] Execute rollback procedure
- [ ] Verify rollback success
- [ ] Monitor for issues
- [ ] Document rollback reason and resolution
- [ ] Plan fix for rolled-back issue

---

## Next Steps

- [ ] Set up monitoring and alerts
- [ ] Configure log aggregation
- [ ] Set up backup strategy
- [ ] Configure auto-scaling (if needed)
- [ ] Set up domain name and DNS
- [ ] Configure CDN (if needed)

---

## Additional Resources

- [OCI Container Instances Documentation](https://docs.oracle.com/en-us/iaas/Content/container-instances/home.htm)
- [OCI-MIGRATION.md](./OCI-MIGRATION.md) - Detailed migration notes
- [API-ARCHITECTURE.md](./API-ARCHITECTURE.md) - API architecture overview

---

**Last Updated:** January 2025  
**Maintained By:** Warmthly Development Team
