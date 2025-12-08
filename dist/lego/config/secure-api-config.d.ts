/**
 * Secure API Configuration
 * Immutable configuration loaded via module scope
 * Prevents global window tampering
 */
/**
 * Validate that a URL is from the expected origin
 */
declare function validateOrigin(url: string): boolean;
/**
 * Get API base URL (immutable)
 */
export declare function getApiBaseUrl(): string;
/**
 * Get full API URL for an endpoint with origin validation
 * @param endpoint - API endpoint path
 * @returns Full API URL
 */
export declare function getApiUrl(endpoint: string): string;
/**
 * Secure API configuration object
 */
export declare const SECURE_API_CONFIG: Readonly<{
    baseUrl: "https://backend.warmthly.org";
    getUrl: typeof getApiUrl;
    validateOrigin: typeof validateOrigin;
}>;
export {};
//# sourceMappingURL=secure-api-config.d.ts.map