# Secure Token Storage: Cookie-Less Architecture

## Overview

Warmthly implements a **world-class cookie-less token storage solution** using the Web Cryptography API and IndexedDB. This approach provides the highest level of security possible without using httpOnly cookies, which aligns with our privacy-first, cookie-free architecture.

## Security Model

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Browser                         │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │  In-Memory Encryption Keys (K_mem)                │   │
│  │  - Generated on page load                         │   │
│  │  - Never persisted to disk                        │   │
│  │  - Cleared on page unload                         │   │
│  └──────────────────────────────────────────────────┘   │
│                          │                                │
│                          │ Uses for encryption/decryption │
│                          ▼                                │
│  ┌──────────────────────────────────────────────────┐   │
│  │  IndexedDB (Encrypted Tokens)                     │   │
│  │  - T_encrypted = Encrypt(T_access, K_mem)         │   │
│  │  - Less accessible than sessionStorage            │   │
│  │  - Encrypted with AES-GCM                          │   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Security Properties

1. **Encryption**: Tokens are encrypted using AES-GCM (256-bit keys)
2. **Key Storage**: Encryption keys exist only in JavaScript memory (never persisted)
3. **Storage Location**: Encrypted tokens stored in IndexedDB (less accessible than sessionStorage)
4. **XSS Protection**: Even if an XSS attack reads the encrypted token, it cannot decrypt it without the in-memory key
5. **Key Derivation**: Uses PBKDF2 with 100,000 iterations for key derivation

## Implementation Details

### Encryption Flow

1. **Backend Authentication**
   - User authenticates with password
   - Server returns JWT access token (`T_access`)

2. **Client-Side Encryption**
   - Client generates encryption key (`K_mem`) using Web Crypto API
   - Key is stored only in JavaScript variable (memory)
   - Token is encrypted: `T_encrypted = AES-GCM-Encrypt(T_access, K_mem)`
   - Encrypted token stored in IndexedDB

3. **Token Retrieval**
   - Client retrieves `T_encrypted` from IndexedDB
   - Decrypts using in-memory key: `T_access = AES-GCM-Decrypt(T_encrypted, K_mem)`
   - Sends decrypted token in Authorization header

### Key Features

- **AES-GCM Encryption**: Industry-standard authenticated encryption
- **PBKDF2 Key Derivation**: 100,000 iterations for key derivation
- **Random IV per Encryption**: Each encryption uses a unique initialization vector
- **Separate Keys**: Access tokens and refresh tokens use different encryption keys
- **Graceful Fallback**: Falls back to sessionStorage if IndexedDB unavailable

## Threat Model

### Protected Against

✅ **XSS Token Theft**: Encrypted tokens cannot be decrypted without in-memory key  
✅ **Session Storage Access**: IndexedDB is less accessible to basic XSS attacks  
✅ **Token Interception**: Tokens are encrypted at rest  
✅ **Key Extraction**: Keys never persist to disk

### Limitations

⚠️ **Advanced XSS**: Sophisticated XSS attacks that can extract in-memory keys before use  
⚠️ **Memory Dumps**: Physical access to device with memory dump capabilities  
⚠️ **Browser Extensions**: Malicious extensions with broad permissions

**Note**: These limitations also apply to httpOnly cookies. Our approach provides equivalent or better security for cookie-less architectures.

## Usage

### Basic Usage

```javascript
// Store token after login
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
await window.SecureAuth.storeAccessToken(token);

// Retrieve token for API requests
const token = await window.SecureAuth.getAccessToken();
fetch('/api/protected', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// Clear token on logout
await window.SecureAuth.clearAccessToken();
```

### Feature Detection

```javascript
if (window.SecureAuth && window.SecureAuth.isSecureStorageAvailable()) {
  // Use secure storage
} else {
  // Fallback to sessionStorage
}
```

## API Reference

### `storeAccessToken(token: string): Promise<void>`

Encrypts and stores an access token securely.

**Parameters:**

- `token`: Plain text JWT token

**Throws:** Error if storage fails

### `getAccessToken(): Promise<string | null>`

Retrieves and decrypts the access token.

**Returns:** Decrypted token or `null` if not found

**Throws:** Error if decryption fails (token is cleared on failure)

### `clearAccessToken(): Promise<void>`

Removes the encrypted access token from storage.

### `isSecureStorageAvailable(): boolean`

Checks if secure storage is available in the current browser.

**Returns:** `true` if IndexedDB and Web Crypto API are available

## Comparison with Alternatives

### vs. httpOnly Cookies

| Feature         | Secure Storage          | httpOnly Cookies              |
| --------------- | ----------------------- | ----------------------------- |
| XSS Protection  | ✅ Encrypted            | ✅ httpOnly flag              |
| CSRF Protection | ✅ Requires CSRF tokens | ⚠️ Vulnerable to CSRF         |
| Cookie-Free     | ✅ Yes                  | ❌ No                         |
| Privacy         | ✅ No tracking cookies  | ⚠️ Cookies sent with requests |
| Same-Site       | ✅ N/A                  | ⚠️ Requires configuration     |

### vs. sessionStorage

| Feature        | Secure Storage | sessionStorage      |
| -------------- | -------------- | ------------------- |
| Encryption     | ✅ AES-GCM     | ❌ Plain text       |
| XSS Protection | ✅ Encrypted   | ❌ Vulnerable       |
| Accessibility  | ✅ IndexedDB   | ⚠️ Easier to access |

## Security Best Practices

1. **Always use HTTPS**: Encryption is only effective over secure connections
2. **Token Expiration**: Implement short-lived tokens (8 hours for access tokens)
3. **Token Rotation**: Rotate refresh tokens on each use
4. **Clear on Logout**: Always clear tokens when user logs out
5. **Error Handling**: Handle storage failures gracefully with fallbacks

## Browser Compatibility

- ✅ Chrome/Edge 37+
- ✅ Firefox 34+
- ✅ Safari 11+
- ✅ Opera 24+

**Fallback**: Automatically falls back to sessionStorage if IndexedDB or Web Crypto API unavailable.

## Future Enhancements

- [ ] Token refresh mechanism with encrypted refresh tokens
- [ ] Token rotation on each refresh
- [ ] Hardware-backed keys (WebAuthn integration)
- [ ] Token expiration monitoring and auto-refresh

## References

- [Web Cryptography API](https://www.w3.org/TR/WebCryptoAPI/)
- [IndexedDB API](https://www.w3.org/TR/IndexedDB/)
- [OWASP Token Storage Guidelines](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html)
- [AES-GCM Specification](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf)

---

**Last Updated**: 2025  
**Maintained By**: Warmthly Security Team
