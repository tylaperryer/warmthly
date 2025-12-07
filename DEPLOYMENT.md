# Deployment Guide

## API Configuration

The API is now deployed on OCI Container Instance and accessible via HTTPS at: `https://backend.warmthly.org`

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

## Auto-Deployment

### GitHub Actions Workflow

Automatic deployment is set up via GitHub Actions:

- **Workflow File**: `warmthly-api/.github/workflows/deploy-oci.yml`
- **Triggers**: 
  - Push to `main` branch
  - Manual workflow dispatch

### Setup Required

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

### How It Works

1. Push code to GitHub
2. GitHub Actions builds Docker image
3. Pushes to OCI Container Registry
4. Updates Container Instance with new image
5. Restarts Container Instance
6. Done! ✅

## Manual Deployment

If you need to deploy manually:

```bash
# In Cloud Shell
cd warmthly-api
git pull
docker build -t us-ashburn-1.ocir.io/id1oqczh26jb/warmthly-api:latest .
docker push us-ashburn-1.ocir.io/id1oqczh26jb/warmthly-api:latest

# Then restart container instance in OCI Console
```

## Testing

### Health Check
```bash
curl https://backend.warmthly.org/health
```

### i18n Endpoints
```bash
# Get languages
curl https://backend.warmthly.org/api/i18n/languages

# Get translations
curl https://backend.warmthly.org/api/i18n/en
```

### Checkout Endpoint
```bash
curl -X POST https://backend.warmthly.org/api/create-checkout \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "currency": "ZAR"}'
```

## Troubleshooting

### API Not Responding
1. Check container instance status in OCI Console
2. Check container logs
3. Verify security list allows port 3000
4. Verify Internet Gateway is configured

### Deployment Fails
1. Check GitHub Actions logs
2. Verify all secrets are set correctly
3. Check OCI Container Registry permissions
4. Verify container instance OCID is correct

## Notes

- API URL is hardcoded in HTML files for now (can be made dynamic later)
- All i18n endpoints now use centralized API config
- GitHub Actions workflow automatically deploys on push to main
- Container Instance uses CI.Standard.A1.Flex shape (free tier eligible)

