/**
 * API Configuration
 * Centralized API base URL configuration
 * Supports environment-based configuration for different deployments
 */
/**
 * Get API base URL from environment or use default
 */
function getApiBaseUrl() {
    // Check for environment variable (set in HTML or build process)
    if (typeof window !== 'undefined' && window.API_BASE_URL) {
        return window.API_BASE_URL;
    }
    // Check for OCI API URL (production)
    if (typeof window !== 'undefined' && window.OCI_API_URL) {
        return window.OCI_API_URL;
    }
    // Default to HTTPS API URL via Cloudflare
    return 'https://backend.warmthly.org';
}
export const API_CONFIG = {
    /**
     * Base URL for API endpoints
     */
    baseUrl: getApiBaseUrl(),
    /**
     * Get full API URL for an endpoint
     * @param endpoint - API endpoint path (with or without leading slash)
     * @returns Full API URL
     */
    getUrl(endpoint) {
        // Remove leading slash if present
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
        // Ensure baseUrl doesn't have trailing slash
        const cleanBaseUrl = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
        return `${cleanBaseUrl}/${cleanEndpoint}`;
    },
    /**
     * Get i18n API URL
     */
    get i18nUrl() {
        return this.getUrl('api/i18n');
    },
    /**
     * Get checkout API URL
     */
    get checkoutUrl() {
        return this.getUrl('api/create-checkout');
    },
};
/**
 * Initialize API config from window variables
 * Call this early in your app initialization
 */
export function initApiConfig() {
    if (typeof window === 'undefined')
        return;
    // Allow override via window.API_BASE_URL
    if (window.API_BASE_URL) {
        API_CONFIG.baseUrl = window.API_BASE_URL;
    }
}
//# sourceMappingURL=api-config.js.map