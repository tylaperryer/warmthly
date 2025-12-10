/**
 * Response Caching Headers Utility
 * Provides utilities for setting appropriate cache headers on API responses
 * Phase 3 Issue 3.12: Missing Response Caching Headers
 */

/**
 * Cache control directives
 */
export enum CacheControl {
  /** No caching - always fetch from server */
  NO_CACHE = 'no-cache, no-store, must-revalidate',
  /** Private cache - only cacheable by browser */
  PRIVATE = 'private, max-age=0, must-revalidate',
  /** Public cache - cacheable by CDN and browser */
  PUBLIC = 'public',
  /** Immutable - content never changes */
  IMMUTABLE = 'public, max-age=31536000, immutable',
}

/**
 * Cache header configuration
 */
export interface CacheHeaderConfig {
  /** Cache control directive */
  cacheControl: CacheControl | string;
  /** Max age in seconds */
  maxAge?: number;
  /** ETag value for cache validation */
  etag?: string;
  /** Last modified date */
  lastModified?: Date | string;
  /** Whether to allow stale responses while revalidating */
  staleWhileRevalidate?: number;
  /** Whether to allow stale responses on error */
  staleIfError?: number;
}

/**
 * Create Cache-Control header value
 *
 * @param config - Cache header configuration
 * @returns Cache-Control header value
 *
 * @example
 * ```typescript
 * const cacheControl = createCacheControl({
 *   cacheControl: CacheControl.PUBLIC,
 *   maxAge: 3600,
 *   staleWhileRevalidate: 86400
 * });
 * res.setHeader('Cache-Control', cacheControl);
 * ```
 */
export function createCacheControl(config: CacheHeaderConfig): string {
  const directives: string[] = [];

  // Handle predefined cache control
  const cacheControlValue = config.cacheControl;

  // Type guard to check if value is a CacheControl enum
  const isCacheControlEnum = (value: string | CacheControl): value is CacheControl => {
    return (
      value === (CacheControl.NO_CACHE as string) ||
      value === (CacheControl.PRIVATE as string) ||
      value === (CacheControl.PUBLIC as string) ||
      value === (CacheControl.IMMUTABLE as string)
    );
  };

  if (isCacheControlEnum(cacheControlValue)) {
    // TypeScript now knows cacheControlValue is CacheControl, not string
    if (cacheControlValue === CacheControl.NO_CACHE) {
      return CacheControl.NO_CACHE;
    }
    if (cacheControlValue === CacheControl.PRIVATE) {
      directives.push('private');
    } else if (cacheControlValue === CacheControl.PUBLIC) {
      directives.push('public');
    } else if (cacheControlValue === CacheControl.IMMUTABLE) {
      return CacheControl.IMMUTABLE;
    }
  } else {
    // Custom cache control string
    directives.push(cacheControlValue);
  }

  // Add max-age if specified
  if (config.maxAge !== undefined) {
    directives.push(`max-age=${config.maxAge}`);
  }

  // Add stale-while-revalidate if specified
  if (config.staleWhileRevalidate !== undefined) {
    directives.push(`stale-while-revalidate=${config.staleWhileRevalidate}`);
  }

  // Add stale-if-error if specified
  if (config.staleIfError !== undefined) {
    directives.push(`stale-if-error=${config.staleIfError}`);
  }

  // Add must-revalidate if max-age is set
  if (config.maxAge !== undefined && config.maxAge > 0) {
    directives.push('must-revalidate');
  }

  return directives.join(', ');
}

/**
 * Set cache headers on response
 *
 * @param res - Response object
 * @param config - Cache header configuration
 *
 * @example
 * ```typescript
 * setCacheHeaders(res, {
 *   cacheControl: CacheControl.PUBLIC,
 *   maxAge: 3600,
 *   etag: generateETag(data)
 * });
 * ```
 */
export function setCacheHeaders(
  res: {
    setHeader: (name: string, value: string | number) => void;
    [key: string]: unknown;
  },
  config: CacheHeaderConfig
): void {
  const cacheControl = createCacheControl(config);
  res.setHeader('Cache-Control', cacheControl);

  if (config.etag) {
    res.setHeader('ETag', config.etag);
  }

  if (config.lastModified) {
    const lastModifiedDate =
      config.lastModified instanceof Date ? config.lastModified : new Date(config.lastModified);
    res.setHeader('Last-Modified', lastModifiedDate.toUTCString());
  }
}

/**
 * Predefined cache configurations for common use cases
 */
export const CacheConfigs = {
  /** No caching - for sensitive or dynamic data */
  noCache: (): CacheHeaderConfig => ({
    cacheControl: CacheControl.NO_CACHE,
  }),

  /** Short cache - for frequently changing data (1 minute) */
  shortCache: (): CacheHeaderConfig => ({
    cacheControl: CacheControl.PUBLIC,
    maxAge: 60,
    staleWhileRevalidate: 300,
  }),

  /** Medium cache - for moderately changing data (1 hour) */
  mediumCache: (): CacheHeaderConfig => ({
    cacheControl: CacheControl.PUBLIC,
    maxAge: 3600,
    staleWhileRevalidate: 86400,
  }),

  /** Long cache - for rarely changing data (1 day) */
  longCache: (): CacheHeaderConfig => ({
    cacheControl: CacheControl.PUBLIC,
    maxAge: 86400,
    staleWhileRevalidate: 604800,
  }),

  /** Currency rates - cache for 5 minutes with 1 hour stale-while-revalidate */
  currencyRates: (): CacheHeaderConfig => ({
    cacheControl: CacheControl.PUBLIC,
    maxAge: 300, // 5 minutes
    staleWhileRevalidate: 3600, // 1 hour
  }),

  /** Static assets - immutable cache */
  staticAssets: (): CacheHeaderConfig => ({
    cacheControl: CacheControl.IMMUTABLE,
  }),
} as const;

/**
 * Generate ETag from data
 *
 * @param data - Data to generate ETag from
 * @returns ETag value
 */
export function generateETag(data: unknown): string {
  const str = JSON.stringify(data);
  // Simple hash function (for production, consider using crypto.createHash)
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `"${Math.abs(hash).toString(16)}"`;
}
