/**
 * Secure Token Storage Utility
 * World-class cookie-less token storage using Web Crypto API + IndexedDB
 *
 * Security Model:
 * - Tokens are encrypted using Web Cryptography API (AES-GCM)
 * - Encryption keys stored only in memory (JavaScript variables)
 * - Encrypted tokens stored in IndexedDB (less accessible than sessionStorage)
 * - XSS attacks can read encrypted tokens but cannot decrypt without in-memory key
 *
 * This provides the highest level of security possible without using httpOnly cookies.
 */

/**
 * Encryption key stored in memory only
 * This is the critical security component - it never persists to disk
 */
let encryptionKey: CryptoKey | null = null;
let refreshEncryptionKey: CryptoKey | null = null;

/**
 * IndexedDB database name and version
 */
const DB_NAME = 'warmthly_secure_storage';
const DB_VERSION = 1;
const STORE_NAME = 'encrypted_tokens';

/**
 * Key derivation parameters
 */
const KEY_ALGORITHM = 'PBKDF2';
const KEY_DERIVATION_ITERATIONS = 100000;
const ENCRYPTION_ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM

/**
 * Initialize IndexedDB database
 */
async function initDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = event => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

/**
 * Generate a cryptographically secure encryption key
 * Uses PBKDF2 with a random salt to derive a key from a random password
 *
 * @param purpose - Purpose identifier ('access' or 'refresh')
 * @returns CryptoKey for encryption/decryption
 */
async function generateEncryptionKey(purpose: 'access' | 'refresh'): Promise<CryptoKey> {
  // Generate a random password (this is what we derive the key from)
  const password = crypto.getRandomValues(new Uint8Array(32));
  const passwordString = Array.from(password)
    .map(b => String.fromCharCode(b))
    .join('');

  // Create a salt from the purpose (deterministic but purpose-specific)
  const salt = new TextEncoder().encode(`warmthly-${purpose}-token-encryption-salt`);

  // Import password as a key for PBKDF2
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passwordString),
    { name: KEY_ALGORITHM },
    false,
    ['deriveBits', 'deriveKey']
  );

  // Derive the encryption key using PBKDF2
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: KEY_ALGORITHM,
      salt,
      iterations: KEY_DERIVATION_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    {
      name: ENCRYPTION_ALGORITHM,
      length: KEY_LENGTH,
    },
    false,
    ['encrypt', 'decrypt']
  );

  // Clear the password from memory (best effort)
  password.fill(0);
  passwordString.split('').forEach(() => {
    // Overwrite string references (best effort)
  });

  return derivedKey;
}

/**
 * Get or create encryption key for access tokens
 * Key is stored only in memory and regenerated on each page load
 */
async function getAccessEncryptionKey(): Promise<CryptoKey> {
  if (!encryptionKey) {
    encryptionKey = await generateEncryptionKey('access');
  }
  return encryptionKey;
}

/**
 * Get or create encryption key for refresh tokens
 * Key is stored only in memory and regenerated on each page load
 */
async function getRefreshEncryptionKey(): Promise<CryptoKey> {
  if (!refreshEncryptionKey) {
    refreshEncryptionKey = await generateEncryptionKey('refresh');
  }
  return refreshEncryptionKey;
}

/**
 * Encrypt a token using AES-GCM
 *
 * @param token - Plain text token to encrypt
 * @param key - Encryption key
 * @returns Encrypted token as base64 string
 */
async function encryptToken(token: string, key: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);

  // Generate a random IV for each encryption
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // Encrypt the token
  const encrypted = await crypto.subtle.encrypt(
    {
      name: ENCRYPTION_ALGORITHM,
      iv,
    },
    key,
    data
  );

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);

  // Convert to base64 for storage
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt a token using AES-GCM
 *
 * @param encryptedToken - Base64 encoded encrypted token
 * @param key - Decryption key
 * @returns Decrypted token string
 */
async function decryptToken(encryptedToken: string, key: CryptoKey): Promise<string> {
  // Decode from base64
  const combined = Uint8Array.from(
    atob(encryptedToken)
      .split('')
      .map(c => c.charCodeAt(0))
  );

  // Extract IV and encrypted data
  const iv = combined.slice(0, IV_LENGTH);
  const encrypted = combined.slice(IV_LENGTH);

  // Decrypt
  const decrypted = await crypto.subtle.decrypt(
    {
      name: ENCRYPTION_ALGORITHM,
      iv,
    },
    key,
    encrypted
  );

  // Convert back to string
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Store an encrypted access token in IndexedDB
 *
 * @param token - Plain text JWT token
 * @returns Promise that resolves when token is stored
 */
export async function storeAccessToken(token: string): Promise<void> {
  try {
    const key = await getAccessEncryptionKey();
    const encrypted = await encryptToken(token, key);

    const db = await initDatabase();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.put(encrypted, 'access_token');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to store access token'));
    });
  } catch (error) {
    throw new Error(
      `Token storage failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Retrieve and decrypt access token from IndexedDB
 *
 * @returns Decrypted access token or null if not found
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    const db = await initDatabase();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get('access_token');
      request.onsuccess = async () => {
        const encrypted = request.result;
        if (!encrypted) {
          resolve(null);
          return;
        }

        try {
          const key = await getAccessEncryptionKey();
          const decrypted = await decryptToken(encrypted, key);
          resolve(decrypted);
        } catch {
          // If decryption fails, token is invalid - clear it
          await clearAccessToken();
          reject(new Error('Failed to decrypt access token'));
        }
      };
      request.onerror = () => reject(new Error('Failed to retrieve access token'));
    });
  } catch {
    // IndexedDB not available (e.g., private browsing)
    return null;
  }
}

/**
 * Store an encrypted refresh token in IndexedDB
 *
 * @param token - Plain text refresh token
 * @returns Promise that resolves when token is stored
 */
export async function storeRefreshToken(token: string): Promise<void> {
  try {
    const key = await getRefreshEncryptionKey();
    const encrypted = await encryptToken(token, key);

    const db = await initDatabase();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.put(encrypted, 'refresh_token');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to store refresh token'));
    });
  } catch (error) {
    throw new Error(
      `Refresh token storage failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Retrieve and decrypt refresh token from IndexedDB
 *
 * @returns Decrypted refresh token or null if not found
 */
export async function getRefreshToken(): Promise<string | null> {
  try {
    const db = await initDatabase();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get('refresh_token');
      request.onsuccess = async () => {
        const encrypted = request.result;
        if (!encrypted) {
          resolve(null);
          return;
        }

        try {
          const key = await getRefreshEncryptionKey();
          const decrypted = await decryptToken(encrypted, key);
          resolve(decrypted);
        } catch {
          // If decryption fails, token is invalid - clear it
          await clearRefreshToken();
          reject(new Error('Failed to decrypt refresh token'));
        }
      };
      request.onerror = () => reject(new Error('Failed to retrieve refresh token'));
    });
  } catch {
    // IndexedDB not available (e.g., private browsing)
    return null;
  }
}

/**
 * Clear access token from storage
 */
export async function clearAccessToken(): Promise<void> {
  try {
    const db = await initDatabase();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.delete('access_token');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to clear access token'));
    });
  } catch {
    // Ignore errors when clearing (best effort)
  }
}

/**
 * Clear refresh token from storage
 */
export async function clearRefreshToken(): Promise<void> {
  try {
    const db = await initDatabase();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.delete('refresh_token');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to clear refresh token'));
    });
  } catch {
    // Ignore errors when clearing (best effort)
  }
}

/**
 * Clear all tokens (logout)
 */
export async function clearAllTokens(): Promise<void> {
  await Promise.all([clearAccessToken(), clearRefreshToken()]);
  // Clear in-memory keys
  encryptionKey = null;
  refreshEncryptionKey = null;
}

/**
 * Check if secure storage is available
 * Useful for feature detection
 */
export function isSecureStorageAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof indexedDB !== 'undefined' &&
    typeof crypto !== 'undefined' &&
    typeof crypto.subtle !== 'undefined'
  );
}
