// Secure API Configuration - Immutable module-based config
// Prevents global window tampering
import { SECURE_API_CONFIG } from '/lego/config/secure-api-config.js';
// Make available for legacy code (read-only)
Object.defineProperty(window, 'API_BASE_URL', {
  get: () => SECURE_API_CONFIG.baseUrl,
  configurable: false,
  enumerable: true,
});
