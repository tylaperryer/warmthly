/**
 * API Versioning and Deprecation System
 * Manages API versions and deprecation notices
 * Security Enhancement 11: API Versioning and Deprecation
 */
import logger from '../utils/logger.js';
/**
 * Supported API versions
 */
const SUPPORTED_VERSIONS = new Map([
    [
        'v1',
        {
            version: 'v1',
            status: 'current',
        },
    ],
]);
/**
 * Default API version
 */
const DEFAULT_VERSION = 'v1';
/**
 * Validate API version
 *
 * @param version - Version string to validate
 * @returns True if version is supported
 */
export function validateAPIVersion(version) {
    if (!version) {
        return true; // Default version will be used
    }
    const versionInfo = SUPPORTED_VERSIONS.get(version);
    return versionInfo !== undefined && versionInfo.status !== 'sunset';
}
/**
 * Get API version information
 *
 * @param version - Version string
 * @returns Version information or null
 */
export function getAPIVersion(version) {
    if (!version) {
        return SUPPORTED_VERSIONS.get(DEFAULT_VERSION) || null;
    }
    return SUPPORTED_VERSIONS.get(version) || null;
}
/**
 * Check if API version is deprecated
 *
 * @param version - Version string
 * @returns True if version is deprecated
 */
export function isVersionDeprecated(version) {
    const versionInfo = getAPIVersion(version);
    return versionInfo?.status === 'deprecated' || versionInfo?.status === 'sunset';
}
/**
 * Get deprecation headers for response
 *
 * @param version - API version
 * @returns Headers object with deprecation information
 */
export function getDeprecationHeaders(version) {
    const versionInfo = getAPIVersion(version);
    if (!versionInfo || versionInfo.status === 'current') {
        return {};
    }
    const headers = {
        Deprecation: 'true',
    };
    if (versionInfo.deprecatedDate) {
        headers['Deprecation-Date'] = versionInfo.deprecatedDate;
    }
    if (versionInfo.sunsetDate) {
        headers['Sunset'] = versionInfo.sunsetDate;
    }
    if (versionInfo.replacementVersion) {
        headers['Link'] = `<${versionInfo.replacementVersion}>; rel="successor-version"`;
    }
    if (versionInfo.migrationGuide) {
        const existingLink = headers['Link'] || '';
        headers['Link'] = existingLink
            ? `${existingLink}, <${versionInfo.migrationGuide}>; rel="deprecation"`
            : `<${versionInfo.migrationGuide}>; rel="deprecation"`;
    }
    return headers;
}
/**
 * Register a new API version
 *
 * @param version - Version information
 */
export function registerAPIVersion(version) {
    SUPPORTED_VERSIONS.set(version.version, version);
    logger.log(`[api-versioning] Registered API version: ${version.version} (${version.status})`);
}
/**
 * Deprecate an API version
 *
 * @param version - Version to deprecate
 * @param deprecatedDate - Date when version was deprecated (ISO string)
 * @param replacementVersion - Replacement version (optional)
 * @param migrationGuide - URL to migration guide (optional)
 */
export function deprecateVersion(version, deprecatedDate, replacementVersion, migrationGuide) {
    const versionInfo = SUPPORTED_VERSIONS.get(version);
    if (!versionInfo) {
        logger.warn(`[api-versioning] Cannot deprecate unknown version: ${version}`);
        return;
    }
    const updated = {
        ...versionInfo,
        status: 'deprecated',
        deprecatedDate,
        replacementVersion,
        migrationGuide,
    };
    SUPPORTED_VERSIONS.set(version, updated);
    logger.warn(`[api-versioning] Deprecated API version: ${version} (deprecated on ${deprecatedDate})`);
}
/**
 * Sunset an API version (mark for removal)
 *
 * @param version - Version to sunset
 * @param sunsetDate - Date when version will be removed (ISO string)
 * @param replacementVersion - Replacement version (optional)
 * @param migrationGuide - URL to migration guide (optional)
 */
export function sunsetVersion(version, sunsetDate, replacementVersion, migrationGuide) {
    const versionInfo = SUPPORTED_VERSIONS.get(version);
    if (!versionInfo) {
        logger.warn(`[api-versioning] Cannot sunset unknown version: ${version}`);
        return;
    }
    const updated = {
        ...versionInfo,
        status: 'sunset',
        sunsetDate,
        replacementVersion,
        migrationGuide,
    };
    SUPPORTED_VERSIONS.set(version, updated);
    logger.warn(`[api-versioning] Sunset API version: ${version} (sunset on ${sunsetDate})`);
}
/**
 * Extract API version from request
 *
 * @param req - Request object
 * @returns Version string or null
 */
export function extractAPIVersion(req) {
    // Check URL path parameter: /api/v1/endpoint
    if (req.url) {
        const versionMatch = req.url.match(/\/api\/(v\d+)\//);
        if (versionMatch) {
            return versionMatch[1];
        }
    }
    // Check query parameter: ?version=v1
    if (req.params?.version) {
        return req.params.version;
    }
    // Check header: X-API-Version
    if (req.headers?.['api-version']) {
        return req.headers['api-version'];
    }
    // Check Accept header: application/vnd.warmthly.v1+json
    if (req.headers?.accept) {
        const acceptMatch = req.headers.accept.match(/vnd\.warmthly\.(v\d+)/);
        if (acceptMatch) {
            return acceptMatch[1];
        }
    }
    return null;
}
/**
 * Middleware to validate and handle API versioning
 *
 * @param req - Request object
 * @param res - Response object
 * @returns True if request should proceed, false if blocked
 */
export function validateAPIVersionMiddleware(req, res) {
    const version = extractAPIVersion(req) || DEFAULT_VERSION;
    // Validate version
    if (!validateAPIVersion(version)) {
        res.status(400).json({
            error: {
                message: `Unsupported API version: ${version}`,
                supportedVersions: Array.from(SUPPORTED_VERSIONS.keys()),
            },
        });
        return { valid: false };
    }
    // Check if deprecated
    const versionInfo = getAPIVersion(version);
    if (versionInfo && isVersionDeprecated(version)) {
        // Add deprecation headers
        const deprecationHeaders = getDeprecationHeaders(version);
        for (const [key, value] of Object.entries(deprecationHeaders)) {
            if (res.setHeader) {
                res.setHeader(key, value);
            }
        }
        // Log deprecation warning
        logger.warn(`[api-versioning] Deprecated API version used: ${version}`);
    }
    return { valid: true, version };
}
/**
 * Get list of supported API versions
 *
 * @returns Array of version strings
 */
export function getSupportedVersions() {
    return Array.from(SUPPORTED_VERSIONS.keys());
}
//# sourceMappingURL=api-versioning.js.map