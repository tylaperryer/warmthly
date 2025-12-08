/**
 * Secure Authentication Module for Admin Pages
 * Uses Web Crypto API + IndexedDB for world-class cookie-less token storage
 *
 * This module provides a secure alternative to sessionStorage for JWT tokens.
 * Tokens are encrypted using AES-GCM with keys stored only in memory.
 */

// Encryption configuration
const DB_NAME = 'warmthly_secure_storage';
const DB_VERSION = 1;
const STORE_NAME = 'encrypted_tokens';
const KEY_ALGORITHM = 'PBKDF2';
const KEY_DERIVATION_ITERATIONS = 100000;
const ENCRYPTION_ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;

// In-memory encryption keys (never persisted)
let encryptionKey = null;
let refreshEncryptionKey = null;

/**
 * Initialize IndexedDB
 */
async function initDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(new Error('Failed to open IndexedDB'));
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

/**
 * Generate encryption key for access tokens
 */
async function getAccessEncryptionKey() {
  if (!encryptionKey) {
    const password = crypto.getRandomValues(new Uint8Array(32));
    const passwordString = Array.from(password)
      .map(b => String.fromCharCode(b))
      .join('');

    const salt = new TextEncoder().encode('warmthly-access-token-encryption-salt');

    const passwordKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(passwordString),
      { name: KEY_ALGORITHM },
      false,
      ['deriveBits', 'deriveKey']
    );

    encryptionKey = await crypto.subtle.deriveKey(
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

    // Clear password from memory
    password.fill(0);
  }
  return encryptionKey;
}

/**
 * Encrypt token
 */
async function encryptToken(token, key) {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const encrypted = await crypto.subtle.encrypt({ name: ENCRYPTION_ALGORITHM, iv }, key, data);

  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt token
 */
async function decryptToken(encryptedToken, key) {
  const combined = Uint8Array.from(
    atob(encryptedToken)
      .split('')
      .map(c => c.charCodeAt(0))
  );

  const iv = combined.slice(0, IV_LENGTH);
  const encrypted = combined.slice(IV_LENGTH);

  const decrypted = await crypto.subtle.decrypt({ name: ENCRYPTION_ALGORITHM, iv }, key, encrypted);

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Store access token securely
 */
async function storeAccessToken(token) {
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
    // Use logger if available, otherwise console (for development)
    if (typeof window !== 'undefined' && window.logger) {
      window.logger.error('Token storage failed:', error);
    } else if (process.env.NODE_ENV !== 'production') {
      console.error('Token storage failed:', error);
    }
    throw error;
  }
}

/**
 * Get access token securely
 */
async function getAccessToken() {
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
        } catch (error) {
          await clearAccessToken();
          reject(new Error('Failed to decrypt access token'));
        }
      };
      request.onerror = () => reject(new Error('Failed to retrieve access token'));
    });
  } catch (error) {
    // IndexedDB not available (e.g., private browsing) - fallback to sessionStorage
    // Use logger if available, otherwise console (for development)
    if (typeof window !== 'undefined' && window.logger) {
      window.logger.warn('Secure storage unavailable, falling back to sessionStorage:', error);
    } else if (process.env.NODE_ENV !== 'production') {
      console.warn('Secure storage unavailable, falling back to sessionStorage:', error);
    }
    return sessionStorage.getItem('warmthly-admin-token');
  }
}

/**
 * Clear access token
 */
async function clearAccessToken() {
  try {
    const db = await initDatabase();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.delete('access_token');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to clear access token'));
    });
  } catch (error) {
    // Best effort - also clear sessionStorage fallback
    sessionStorage.removeItem('warmthly-admin-token');
  }
}

/**
 * Check if secure storage is available
 */
function isSecureStorageAvailable() {
  return (
    typeof window !== 'undefined' &&
    typeof indexedDB !== 'undefined' &&
    typeof crypto !== 'undefined' &&
    typeof crypto.subtle !== 'undefined'
  );
}

// Export for use in admin pages
window.SecureAuth = {
  storeAccessToken,
  getAccessToken,
  clearAccessToken,
  isSecureStorageAvailable,
};
