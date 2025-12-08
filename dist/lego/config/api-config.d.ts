/**
 * API Configuration
 * Centralized API base URL configuration
 * Supports environment-based configuration for different deployments
 */
export declare const API_CONFIG: {
    /**
     * Base URL for API endpoints
     */
    baseUrl: string;
    /**
     * Get full API URL for an endpoint
     * @param endpoint - API endpoint path (with or without leading slash)
     * @returns Full API URL
     */
    getUrl(endpoint: string): string;
    /**
     * Get i18n API URL
     */
    readonly i18nUrl: string;
    /**
     * Get checkout API URL
     */
    readonly checkoutUrl: string;
};
/**
 * Initialize API config from window variables
 * Call this early in your app initialization
 */
export declare function initApiConfig(): void;
//# sourceMappingURL=api-config.d.ts.map