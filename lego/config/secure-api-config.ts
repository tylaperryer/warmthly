/**
 * Secure API Configuration
 * Immutable configuration loaded via module scope
 * Prevents global window tampering
 */

// Immutable API base URL - cannot be modified after module load
const API_BASE_URL = 'https://backend.warmthly.org';

/**
 * Validate that a URL is from the expected origin
 */
function validateOrigin(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const expectedOrigin = new URL(API_BASE_URL).origin;
    return urlObj.origin === expectedOrigin;
  } catch {
    return false;
  }
}

/**
 * Get API base URL (immutable)
 */
export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

/**
 * Get full API URL for an endpoint with origin validation
 * @param endpoint - API endpoint path
 * @returns Full API URL
 */
export function getApiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const cleanBaseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const fullUrl = `${cleanBaseUrl}/${cleanEndpoint}`;

  // Validate origin before returning
  if (!validateOrigin(fullUrl)) {
    throw new Error('Invalid API endpoint origin');
  }

  return fullUrl;
}

/**
 * Secure API configuration object
 */
export const SECURE_API_CONFIG = Object.freeze({
  baseUrl: API_BASE_URL,
  getUrl: getApiUrl,
  validateOrigin,
});
