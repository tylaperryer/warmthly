/**
 * API Versioning and Deprecation System
 * Manages API versions and deprecation notices
 * Security Enhancement 11: API Versioning and Deprecation
 */
/**
 * API version information
 */
export interface APIVersion {
    readonly version: string;
    readonly status: 'current' | 'deprecated' | 'sunset';
    readonly deprecatedDate?: string;
    readonly sunsetDate?: string;
    readonly replacementVersion?: string;
    readonly migrationGuide?: string;
}
/**
 * Validate API version
 *
 * @param version - Version string to validate
 * @returns True if version is supported
 */
export declare function validateAPIVersion(version: string | null | undefined): boolean;
/**
 * Get API version information
 *
 * @param version - Version string
 * @returns Version information or null
 */
export declare function getAPIVersion(version: string | null | undefined): APIVersion | null;
/**
 * Check if API version is deprecated
 *
 * @param version - Version string
 * @returns True if version is deprecated
 */
export declare function isVersionDeprecated(version: string | null | undefined): boolean;
/**
 * Get deprecation headers for response
 *
 * @param version - API version
 * @returns Headers object with deprecation information
 */
export declare function getDeprecationHeaders(version: string | null | undefined): Record<string, string>;
/**
 * Register a new API version
 *
 * @param version - Version information
 */
export declare function registerAPIVersion(version: APIVersion): void;
/**
 * Deprecate an API version
 *
 * @param version - Version to deprecate
 * @param deprecatedDate - Date when version was deprecated (ISO string)
 * @param replacementVersion - Replacement version (optional)
 * @param migrationGuide - URL to migration guide (optional)
 */
export declare function deprecateVersion(version: string, deprecatedDate: string, replacementVersion?: string, migrationGuide?: string): void;
/**
 * Sunset an API version (mark for removal)
 *
 * @param version - Version to sunset
 * @param sunsetDate - Date when version will be removed (ISO string)
 * @param replacementVersion - Replacement version (optional)
 * @param migrationGuide - URL to migration guide (optional)
 */
export declare function sunsetVersion(version: string, sunsetDate: string, replacementVersion?: string, migrationGuide?: string): void;
/**
 * Extract API version from request
 *
 * @param req - Request object
 * @returns Version string or null
 */
export declare function extractAPIVersion(req: {
    readonly url?: string;
    readonly headers?: {
        readonly 'api-version'?: string;
        readonly accept?: string;
        readonly [key: string]: string | undefined;
    };
    readonly params?: {
        readonly version?: string;
        readonly [key: string]: string | undefined;
    };
}): string | null;
/**
 * Middleware to validate and handle API versioning
 *
 * @param req - Request object
 * @param res - Response object
 * @returns True if request should proceed, false if blocked
 */
export declare function validateAPIVersionMiddleware(req: {
    readonly url?: string;
    readonly headers?: {
        readonly 'api-version'?: string;
        readonly accept?: string;
        readonly [key: string]: string | undefined;
    };
    readonly params?: {
        readonly version?: string;
        readonly [key: string]: string | undefined;
    };
}, res: {
    status: (code: number) => {
        json: (data: unknown) => unknown;
        setHeader?: (name: string, value: string) => unknown;
        [key: string]: unknown;
    };
    setHeader?: (name: string, value: string) => unknown;
    [key: string]: unknown;
}): {
    readonly valid: boolean;
    readonly version?: string;
};
/**
 * Get list of supported API versions
 *
 * @returns Array of version strings
 */
export declare function getSupportedVersions(): string[];
//# sourceMappingURL=api-versioning.d.ts.map