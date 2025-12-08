# Yoco SDK Subresource Integrity (SRI)

## Overview

Subresource Integrity (SRI) is a security feature that allows browsers to verify that resources they fetch (for example, from a CDN) are delivered without unexpected manipulation. It works by allowing you to provide a cryptographic hash that a fetched resource must match.

## Current Status

The Yoco SDK is currently loaded **without SRI** due to the unavailability of the SRI hash from Yoco. This is a known security limitation that should be addressed.

## Security Implications

**Without SRI:**
- If Yoco's CDN is compromised, malicious code could be injected
- No verification that the script hasn't been tampered with
- Supply chain attack risk

**Current Mitigations:**
- ✅ HTTPS-only loading (enforced)
- ✅ Version-pinned URL (`/sdk/v1/yoco-sdk-web.js`)
- ✅ Cross-origin restrictions
- ✅ Referrer policy set
- ⚠️ **Missing SRI hash** (this document)

## How to Obtain SRI Hash

### Option 1: Contact Yoco Support (Recommended)

1. **Contact Yoco Support:**
   - Email: support@yoco.com
   - Subject: "SRI Hash Request for SDK v1"
   - Request: "Please provide the Subresource Integrity (SRI) hash for `https://js.yoco.com/sdk/v1/yoco-sdk-web.js`"

2. **What to Request:**
   - SRI hash (SHA-384 recommended)
   - Hash algorithm used (SHA-256, SHA-384, or SHA-512)
   - Confirmation that the hash is for the specific version/URL

3. **Once Received:**
   - Update `warmthly/apps/main/index.html` line 1084
   - Uncomment and add the hash:
     ```javascript
     script.integrity = 'sha384-<hash-from-yoco>';
     ```

### Option 2: Generate Hash Locally (Not Recommended)

**⚠️ Warning:** This method is less secure because:
- The hash must be regenerated every time Yoco updates the SDK
- No guarantee the file hasn't been tampered with before you download it
- Manual process prone to errors

**Steps:**
1. Download the SDK file:
   ```bash
   curl -o yoco-sdk-web.js https://js.yoco.com/sdk/v1/yoco-sdk-web.js
   ```

2. Generate SHA-384 hash:
   ```bash
   # macOS/Linux
   openssl dgst -sha384 -binary yoco-sdk-web.js | openssl base64 -A
   
   # Windows (PowerShell)
   $file = Get-Content yoco-sdk-web.js -Raw -Encoding Byte
   $hash = [System.Security.Cryptography.SHA384]::Create().ComputeHash($file)
   [Convert]::ToBase64String($hash)
   ```

3. Add to code:
   ```javascript
   script.integrity = 'sha384-<generated-hash>';
   ```

### Option 3: Use Online SRI Hash Generator

1. Visit: https://www.srihash.org/
2. Enter URL: `https://js.yoco.com/sdk/v1/yoco-sdk-web.js`
3. Select algorithm: SHA-384 (recommended)
4. Copy the generated hash
5. Add to code

**⚠️ Warning:** Only use trusted online tools. Verify the hash matches what Yoco provides.

## Implementation

Once you have the SRI hash, update the code in `warmthly/apps/main/index.html`:

**Current Code (lines 1081-1086):**
```javascript
// SECURITY: Subresource Integrity (SRI) hash
// TODO: Contact Yoco support to obtain the SRI hash for this specific version
// Once obtained, uncomment and add the hash:
// script.integrity = 'sha384-...'; // Get from Yoco support
// For now, we rely on HTTPS and version pinning for security
// script.integrity = 'sha384-...';
```

**Updated Code:**
```javascript
// SECURITY: Subresource Integrity (SRI) hash
// Hash obtained from Yoco support on [DATE]
script.integrity = 'sha384-<ACTUAL_HASH_FROM_YOCO>';
```

## Testing

After adding the SRI hash:

1. **Test in Development:**
   - Load the page and verify SDK loads correctly
   - Check browser console for SRI errors
   - Test payment flow end-to-end

2. **Test in Production:**
   - Deploy to staging first
   - Verify SDK loads and payments work
   - Monitor for SRI validation errors

3. **Monitor for Issues:**
   - If Yoco updates the SDK, the hash will fail
   - You'll need to obtain a new hash
   - Consider automated monitoring for SRI failures

## Maintenance

### When Yoco Updates SDK

1. **Detect Update:**
   - Monitor for SRI validation failures
   - Check Yoco changelog/release notes
   - Test payment flow regularly

2. **Update Hash:**
   - Contact Yoco for new hash
   - Update code with new hash
   - Test thoroughly before deploying

3. **Version Pinning:**
   - Consider using specific version URLs if available
   - Example: `https://js.yoco.com/sdk/v1.2.3/yoco-sdk-web.js`
   - This reduces frequency of hash updates

## Alternative Solutions

If SRI hash is unavailable:

1. **Self-Host SDK:**
   - Download SDK and host on your own CDN
   - Generate hash for your hosted version
   - More control but requires maintenance

2. **Content Security Policy (CSP):**
   - Use strict CSP to restrict script sources
   - Already implemented but SRI is additional layer

3. **Certificate Pinning:**
   - Pin Yoco's SSL certificate
   - Provides transport security but not content integrity

## Related Security Measures

The payment flow includes multiple security layers:

- ✅ HTTPS-only communication
- ✅ Origin validation for API calls
- ✅ Server-side payment verification
- ✅ Input validation and sanitization
- ✅ Error message sanitization
- ⚠️ **SRI for SDK** (this document)

## References

- [MDN: Subresource Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity)
- [W3C SRI Specification](https://www.w3.org/TR/SRI/)
- [Yoco Developer Documentation](https://developer.yoco.com/)

---

**Last Updated:** 2024-12-19  
**Status:** ⚠️ Pending - SRI hash not yet obtained from Yoco  
**Priority:** High  
**Assigned To:** Development Team

