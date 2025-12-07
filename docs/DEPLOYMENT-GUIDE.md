# Warmthly API Deployment Guide

Complete step-by-step guide for deploying the Warmthly API to Oracle Cloud Infrastructure (OCI).

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [OCI Setup](#oci-setup)
3. [Container Registry Setup](#container-registry-setup)
4. [Container Instance Creation](#container-instance-creation)
5. [Network Configuration](#network-configuration)
6. [Environment Variables](#environment-variables)
7. [Deployment Methods](#deployment-methods)
8. [Verification](#verification)
9. [Troubleshooting](#troubleshooting)

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

2. **Verify environment variables:**
   - Ensure all required variables are set
   - Check for typos in variable names

3. **Check resource limits:**
   - Verify OCPU and memory are sufficient
   - Check if Always Free limits are exceeded

### API Not Accessible

1. **Check security list:**
   - Verify ingress rules allow ports 80/443
   - Source should be `0.0.0.0/0` for public access

2. **Verify public IP:**
   - Ensure Container Instance has public IP assigned
   - Check if IP is correct

3. **Test connectivity:**
   ```bash
   curl -v http://<public-ip>/health
   ```

### Redis Connection Issues

1. **Check REDIS_URL:**
   - Verify Redis URL is correct
   - Test connection from local machine

2. **Check Redis security:**
   - Ensure Redis allows connections from Container Instance IP
   - Verify firewall rules

### SSL/HTTPS Issues

1. **If using Greenlock:**
   - Verify `LE_EMAIL` is set
   - Check `USE_GREENLOCK=true`
   - Review Let's Encrypt logs

2. **If using Load Balancer:**
   - Verify SSL certificate is configured
   - Check listener configuration

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

